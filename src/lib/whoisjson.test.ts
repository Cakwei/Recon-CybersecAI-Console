import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainEnumerationResult, SslAuditResult } from "./types";
import {
	auditSslServerFn,
	cleanDomain,
	domainInputSchema,
	enumerateDomainServerFn,
	fetchDnsRecon,
	fetchDomainEnumeration,
	fetchSslAudit,
	reconDnsServerFn,
} from "./whoisjson";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("whoisjson module", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetAllMocks();
		process.env = { ...originalEnv, WHOIS_API_KEY: "test_whois_api_key_123" };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("cleanDomain()", () => {
		it("should return the domain unchanged if already clean and lowercase", () => {
			expect(cleanDomain("example.com")).toBe("example.com");
		});

		it("should convert uppercase domain to lowercase", () => {
			expect(cleanDomain("EXAMPLE.COM")).toBe("example.com");
			expect(cleanDomain("Sub.Domain.Org")).toBe("sub.domain.org");
		});

		it("should trim surrounding whitespace", () => {
			expect(cleanDomain("   example.com   ")).toBe("example.com");
			expect(cleanDomain("\t\n example.com \n")).toBe("example.com");
		});

		it("should strip http:// protocol", () => {
			expect(cleanDomain("http://example.com")).toBe("example.com");
			expect(cleanDomain("HTTP://example.com")).toBe("example.com");
		});

		it("should strip https:// protocol", () => {
			expect(cleanDomain("https://example.com")).toBe("example.com");
			expect(cleanDomain("HTTPS://example.com")).toBe("example.com");
		});

		it("should strip URL paths", () => {
			expect(cleanDomain("example.com/path/to/resource")).toBe("example.com");
			expect(cleanDomain("https://example.com/api/v1?query=test")).toBe(
				"example.com",
			);
		});

		it("should strip port numbers", () => {
			expect(cleanDomain("example.com:8080")).toBe("example.com");
			expect(cleanDomain("https://example.com:443/login")).toBe("example.com");
		});

		it("should handle complex full URLs with protocol, subdomain, port, and path", () => {
			expect(
				cleanDomain(
					"  HTTPS://SUB.API.EXAMPLE.CO.UK:8443/v1/auth?token=123#hash ",
				),
			).toBe("sub.api.example.co.uk");
		});

		it("should handle empty or whitespace-only strings", () => {
			expect(cleanDomain("")).toBe("");
			expect(cleanDomain("   ")).toBe("");
		});
	});

	describe("fetchSslAudit()", () => {
		const mockSslResult: SslAuditResult = {
			domain: "example.com",
			valid: true,
			valid_from: "2026-01-01T00:00:00Z",
			valid_to: "2026-12-31T23:59:59Z",
			issuer: {
				C: "US",
				O: "Let's Encrypt",
				CN: "R3",
			},
			details: {
				subjectaltname: "DNS:example.com, DNS:www.example.com",
				bits: 2048,
				fingerprint256: "AA:BB:CC:DD",
			},
		};

		it("should throw an error if the raw domain is empty or whitespace", async () => {
			await expect(fetchSslAudit("")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
			await expect(fetchSslAudit("   ")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
		});

		it("should throw an error if WHOIS_API_KEY is not defined in the environment", async () => {
			delete process.env.WHOIS_API_KEY;
			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"WHOIS_API_KEY is not configured in the server environment (.env).",
			);
		});

		it("should successfully fetch and return SSL audit details", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: mockSslResult,
			});

			const result = await fetchSslAudit("https://EXAMPLE.COM/some-path");

			expect(mockedAxios.get).toHaveBeenCalledTimes(1);
			expect(mockedAxios.get).toHaveBeenCalledWith(
				"https://whoisjson.com/api/v1/ssl-cert-check",
				{
					params: { domain: "example.com" },
					headers: { Authorization: "TOKEN=test_whois_api_key_123" },
					timeout: 15000,
				},
			);
			expect(result).toEqual(mockSslResult);
		});

		it("should throw an error if the API returns empty/falsy response data", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: null,
			});

			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"SSL/TLS Audit error for example.com: No SSL certificate data returned from WhoisJSON.",
			);
		});

		it("should extract error message from API response data.message", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						message: "Certificate not found or domain unreachable",
					},
				},
			});

			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"SSL/TLS Audit error for example.com: Certificate not found or domain unreachable",
			);
		});

		it("should extract error message from API response data.error", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						error: "Invalid API token",
					},
				},
			});

			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"SSL/TLS Audit error for example.com: Invalid API token",
			);
		});

		it("should fall back to Axios error message if response body has no message", async () => {
			mockedAxios.get.mockRejectedValueOnce(
				new Error("Network timeout after 15000ms"),
			);

			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"SSL/TLS Audit error for example.com: Network timeout after 15000ms",
			);
		});

		it("should fall back to generic message if Axios error has no message or details", async () => {
			mockedAxios.get.mockRejectedValueOnce({});

			await expect(fetchSslAudit("example.com")).rejects.toThrow(
				"SSL/TLS Audit error for example.com: Failed to perform SSL/TLS audit.",
			);
		});
	});

	describe("fetchDnsRecon()", () => {
		const mockDnsPayload = {
			A: ["93.184.216.34"],
			AAAA: ["2606:2800:220:1:248:1893:25c8:1946"],
			MX: [{ exchange: "mail.example.com", priority: 10 }],
			NS: ["a.iana-servers.net", "b.iana-servers.net"],
			TXT: ["v=spf1 -all"],
			DMARC: ["v=DMARC1; p=reject"],
		};

		it("should throw an error if domain is empty or whitespace", async () => {
			await expect(fetchDnsRecon("")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
			await expect(fetchDnsRecon("   ")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
		});

		it("should throw an error if WHOIS_API_KEY is not defined", async () => {
			delete process.env.WHOIS_API_KEY;
			await expect(fetchDnsRecon("example.com")).rejects.toThrow(
				"WHOIS_API_KEY is not configured in the server environment (.env).",
			);
		});

		it("should fetch DNS records and attach the cleaned domain name to result", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: mockDnsPayload,
			});

			const result = await fetchDnsRecon("https://EXAMPLE.COM:8080/path");

			expect(mockedAxios.get).toHaveBeenCalledTimes(1);
			expect(mockedAxios.get).toHaveBeenCalledWith(
				"https://whoisjson.com/api/v1/nslookup",
				{
					params: { domain: "example.com" },
					headers: { Authorization: "TOKEN=test_whois_api_key_123" },
					timeout: 15000,
				},
			);
			expect(result).toEqual({
				name: "example.com",
				...mockDnsPayload,
			});
		});

		it("should throw an error if the API returns empty data", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: null,
			});

			await expect(fetchDnsRecon("example.com")).rejects.toThrow(
				"DNS Recon error for example.com: No DNS records returned from WhoisJSON.",
			);
		});

		it("should extract error message from API response data.message", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						message: "No nameserver found",
					},
				},
			});

			await expect(fetchDnsRecon("example.com")).rejects.toThrow(
				"DNS Recon error for example.com: No nameserver found",
			);
		});

		it("should extract error message from API response data.error", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						error: "Lookup query timed out",
					},
				},
			});

			await expect(fetchDnsRecon("example.com")).rejects.toThrow(
				"DNS Recon error for example.com: Lookup query timed out",
			);
		});

		it("should fall back to generic message on empty rejection", async () => {
			mockedAxios.get.mockRejectedValueOnce({});

			await expect(fetchDnsRecon("example.com")).rejects.toThrow(
				"DNS Recon error for example.com: Failed to perform DNS reconnaissance.",
			);
		});
	});

	describe("fetchDomainEnumeration()", () => {
		const mockEnumResult: DomainEnumerationResult = {
			domain: "example.com",
			wildcard_detected: false,
			total_found: 2,
			scan_time_ms: 1250,
			subdomains: [
				{
					subdomain: "api.example.com",
					type: "A",
					ips: ["93.184.216.35"],
					status: "active",
				},
				{
					subdomain: "mail.example.com",
					type: "CNAME",
					ips: ["93.184.216.36"],
					status: "active",
				},
			],
		};

		it("should throw an error if domain is empty or whitespace", async () => {
			await expect(fetchDomainEnumeration("")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
			await expect(fetchDomainEnumeration("   ")).rejects.toThrow(
				"Please provide a valid domain name.",
			);
		});

		it("should throw an error if WHOIS_API_KEY is not defined", async () => {
			delete process.env.WHOIS_API_KEY;
			await expect(fetchDomainEnumeration("example.com")).rejects.toThrow(
				"WHOIS_API_KEY is not configured in the server environment (.env).",
			);
		});

		it("should fetch subdomain enumeration with 25000ms timeout", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: mockEnumResult,
			});

			const result = await fetchDomainEnumeration(
				"http://example.com:3000/test",
			);

			expect(mockedAxios.get).toHaveBeenCalledTimes(1);
			expect(mockedAxios.get).toHaveBeenCalledWith(
				"https://whoisjson.com/api/v1/subdomains",
				{
					params: { domain: "example.com" },
					headers: { Authorization: "TOKEN=test_whois_api_key_123" },
					timeout: 25000,
				},
			);
			expect(result).toEqual(mockEnumResult);
		});

		it("should throw an error if response data is empty", async () => {
			mockedAxios.get.mockResolvedValueOnce({
				data: null,
			});

			await expect(fetchDomainEnumeration("example.com")).rejects.toThrow(
				"Domain enumeration error for example.com: No subdomain enumeration data returned from WhoisJSON.",
			);
		});

		it("should extract message from API response data.message", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						message: "Enumeration quota exceeded for current plan",
					},
				},
			});

			await expect(fetchDomainEnumeration("example.com")).rejects.toThrow(
				"Domain enumeration error for example.com: Enumeration quota exceeded for current plan",
			);
		});

		it("should extract error from API response data.error", async () => {
			mockedAxios.get.mockRejectedValueOnce({
				response: {
					data: {
						error: "Zone transfer blocked",
					},
				},
			});

			await expect(fetchDomainEnumeration("example.com")).rejects.toThrow(
				"Domain enumeration error for example.com: Zone transfer blocked",
			);
		});

		it("should fall back to generic message on empty rejection", async () => {
			mockedAxios.get.mockRejectedValueOnce({});

			await expect(fetchDomainEnumeration("example.com")).rejects.toThrow(
				"Domain enumeration error for example.com: Failed to enumerate subdomains.",
			);
		});
	});

	describe("domainInputSchema", () => {
		it("should accept valid domain input", () => {
			const parsed = domainInputSchema.parse({ domain: "example.com" });
			expect(parsed).toEqual({ domain: "example.com" });
		});

		it("should reject empty domain with descriptive error", () => {
			expect(() => domainInputSchema.parse({ domain: "" })).toThrow(
				"Domain name is required",
			);
		});

		it("should reject missing domain property", () => {
			expect(() => domainInputSchema.parse({})).toThrow();
		});

		it("should reject non-string domain", () => {
			expect(() => domainInputSchema.parse({ domain: 12345 })).toThrow();
		});
	});

	describe("Server Functions Configuration", () => {
		it("should export auditSslServerFn configured as POST server function", () => {
			expect(auditSslServerFn).toBeDefined();
			expect(typeof auditSslServerFn).toBe("function");
			expect((auditSslServerFn as unknown as { method?: string }).method).toBe(
				"POST",
			);
		});

		it("should export reconDnsServerFn configured as POST server function", () => {
			expect(reconDnsServerFn).toBeDefined();
			expect(typeof reconDnsServerFn).toBe("function");
			expect((reconDnsServerFn as unknown as { method?: string }).method).toBe(
				"POST",
			);
		});

		it("should export enumerateDomainServerFn configured as POST server function", () => {
			expect(enumerateDomainServerFn).toBeDefined();
			expect(typeof enumerateDomainServerFn).toBe("function");
			expect(
				(enumerateDomainServerFn as unknown as { method?: string }).method,
			).toBe("POST");
		});
	});
});
