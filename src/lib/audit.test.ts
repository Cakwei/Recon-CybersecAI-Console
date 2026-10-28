import { describe, expect, it, vi } from "vitest";
import { calculateSecurityScorecard, performUnifiedAudit } from "./audit";
import * as serverModule from "./server";
import * as utilsModule from "./utils";
import * as whoisModule from "./whoisjson";

describe("audit module", () => {
	describe("calculateSecurityScorecard()", () => {
		it("should award Grade A (100) for pristine security configuration", () => {
			const scorecard = calculateSecurityScorecard({
				ssl: {
					domain: "example.com",
					valid: true,
					valid_from: "2026-01-01T00:00:00Z",
					valid_to: "2026-12-31T00:00:00Z",
					details: { bits: 2048 },
				},
				dnsData: {
					name: "example.com",
					TXT: ["v=spf1 include:_spf.example.com ~all"],
					DMARC: ["v=DMARC1; p=reject"],
					CAA: ['0 issue "letsencrypt.org"'],
					MX: [{ exchange: "mail.example.com", priority: 10 }],
				},
				host: {
					ip: "93.184.216.34",
					ports: [80, 443],
					vulns: [],
					hostnames: ["example.com"],
					cpes: [],
					tags: [],
				},
				subdomains: {
					domain: "example.com",
					wildcard_detected: false,
					total_found: 2,
					scan_time_ms: 100,
					subdomains: [],
				},
			});

			expect(scorecard.grade).toBe("A");
			expect(scorecard.score).toBe(100);
			expect(scorecard.risks).toHaveLength(0);
		});

		it("should penalize invalid or expired SSL certificate", () => {
			const scorecard = calculateSecurityScorecard({
				ssl: {
					domain: "expired.com",
					valid: false,
					valid_from: "2020-01-01T00:00:00Z",
					valid_to: "2021-01-01T00:00:00Z",
				},
				dnsData: null,
				host: null,
				subdomains: null,
			});

			expect(scorecard.score).toBeLessThan(70);
			const sslRisk = scorecard.risks.find((r) => r.category === "ssl");
			expect(sslRisk).toBeDefined();
			expect(sslRisk?.severity).toBe("critical");
		});

		it("should penalize missing SPF and missing DMARC records", () => {
			const scorecard = calculateSecurityScorecard({
				ssl: null,
				dnsData: {
					name: "no-email-sec.com",
					TXT: ["some-other-verification=123"],
					DMARC: [],
				},
				host: null,
				subdomains: null,
			});

			expect(scorecard.risks.some((r) => r.id === "dns-no-spf")).toBe(true);
			expect(scorecard.risks.some((r) => r.id === "dns-no-dmarc")).toBe(true);
			expect(scorecard.score).toBeLessThanOrEqual(80);
		});

		it("should flag exposed dangerous database and management ports", () => {
			const scorecard = calculateSecurityScorecard({
				ssl: null,
				dnsData: null,
				host: {
					ip: "1.2.3.4",
					ports: [22, 3306, 5432, 27017, 3389],
					vulns: [],
					hostnames: [],
					cpes: [],
					tags: [],
				},
				subdomains: null,
			});

			expect(scorecard.risks.some((r) => r.id === "port-3306")).toBe(true);
			expect(scorecard.risks.some((r) => r.id === "port-5432")).toBe(true);
			expect(scorecard.risks.some((r) => r.id === "port-27017")).toBe(true);
			expect(scorecard.risks.some((r) => r.id === "port-3389")).toBe(true);
			expect(scorecard.score).toBeLessThan(60);
			expect(scorecard.grade).toBe("F");
		});

		it("should severely penalize cataloged CVE vulnerabilities", () => {
			const scorecard = calculateSecurityScorecard({
				ssl: null,
				dnsData: null,
				host: {
					ip: "1.2.3.4",
					ports: [80],
					vulns: ["CVE-2021-44228", "CVE-2022-22965", "CVE-2023-38606"],
					hostnames: [],
					cpes: [],
					tags: [],
				},
				subdomains: null,
			});

			expect(scorecard.risks.some((r) => r.id === "cves-multiple")).toBe(true);
			expect(scorecard.metrics.cvesCount).toBe(3);
			expect(scorecard.metrics.criticalCount).toBeGreaterThanOrEqual(1);
		});
	});

	describe("performUnifiedAudit()", () => {
		it("should reject empty or whitespace target", async () => {
			await expect(performUnifiedAudit("")).rejects.toThrow();
			await expect(performUnifiedAudit("   ")).rejects.toThrow();
		});

		it("should perform domain audit and coordinate sub-services", async () => {
			vi.spyOn(whoisModule, "fetchSslAudit").mockResolvedValueOnce({
				domain: "test.com",
				valid: true,
				valid_from: "2026-01-01",
				valid_to: "2026-12-31",
			});

			vi.spyOn(whoisModule, "fetchDnsRecon").mockResolvedValueOnce({
				name: "test.com",
				TXT: ["v=spf1 -all"],
				DMARC: ["v=DMARC1; p=reject"],
			});

			vi.spyOn(whoisModule, "fetchDomainEnumeration").mockResolvedValueOnce({
				domain: "test.com",
				wildcard_detected: false,
				total_found: 1,
				scan_time_ms: 50,
				subdomains: [],
			});

			vi.spyOn(utilsModule, "fetchWhoIsInfo").mockResolvedValueOnce({
				name: "test.com",
				status: [],
				nameserver: [],
				nsAnalysis: { detectedProviders: [] },
				ips: "",
				created: "",
				changed: "",
				expires: "",
				age: { days: 0, months: 0, years: 0 },
				expiration: { daysLeft: 100, isExpiringSoon: false, isExpired: false },
				dnssec: "",
				source: "",
				registrar: { name: "Registrar", email: null },
			});

			const result = await performUnifiedAudit("test.com");

			expect(result.cleanedTarget).toBe("test.com");
			expect(result.scorecard).toBeDefined();
			expect(result.ssl?.valid).toBe(true);
			expect(result.dns?.name).toBe("test.com");
		});

		it("should audit pure IPv4 target directly with host lookup", async () => {
			vi.spyOn(serverModule, "fetchShodanHost").mockResolvedValueOnce({
				ip: "8.8.8.8",
				ports: [53, 443],
				vulns: [],
				hostnames: ["dns.google"],
				cpes: [],
				tags: [],
			});

			const result = await performUnifiedAudit("8.8.8.8");

			expect(result.isIp).toBe(true);
			expect(result.cleanedTarget).toBe("8.8.8.8");
			expect(result.host?.ip).toBe("8.8.8.8");
			expect(result.host?.ports).toEqual([53, 443]);
		});
	});
});
