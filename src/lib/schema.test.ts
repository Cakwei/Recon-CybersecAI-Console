import { describe, expect, it } from "vitest";
import {
	cleanDomainSchema,
	cleanTargetSchema,
	domainSchema,
	ipSchema,
	sanitizeHostInput,
} from "./schema";

describe("schema module", () => {
	describe("domainSchema", () => {
		it("should transform domain without protocol by prepending https://", () => {
			expect(domainSchema.parse("example.com")).toBe("https://example.com");
			expect(domainSchema.parse("sub.example.com")).toBe(
				"https://sub.example.com",
			);
			expect(domainSchema.parse("api.v1.service.co.uk")).toBe(
				"https://api.v1.service.co.uk",
			);
		});

		it("should preserve existing http:// protocol", () => {
			expect(domainSchema.parse("http://example.com")).toBe(
				"http://example.com",
			);
			expect(domainSchema.parse("HTTP://example.com")).toBe(
				"HTTP://example.com",
			);
		});

		it("should preserve existing https:// protocol", () => {
			expect(domainSchema.parse("https://example.com")).toBe(
				"https://example.com",
			);
			expect(domainSchema.parse("HTTPS://example.com")).toBe(
				"HTTPS://example.com",
			);
		});

		it("should trim surrounding whitespace before transforming", () => {
			expect(domainSchema.parse("   example.com   ")).toBe(
				"https://example.com",
			);
			expect(domainSchema.parse("  https://example.com  ")).toBe(
				"https://example.com",
			);
		});

		it("should allow domains with port numbers and paths", () => {
			expect(domainSchema.parse("example.com:8080/path")).toBe(
				"https://example.com:8080/path",
			);
			expect(domainSchema.parse("https://example.com:3000/api?q=1")).toBe(
				"https://example.com:3000/api?q=1",
			);
		});

		it("should reject empty or whitespace-only inputs", () => {
			const resEmpty = domainSchema.safeParse("");
			expect(resEmpty.success).toBe(false);
			if (!resEmpty.success) {
				expect(resEmpty.error.issues[0]?.message).toBe("Invalid domain name");
			}

			const resWhitespace = domainSchema.safeParse("    ");
			expect(resWhitespace.success).toBe(false);
			if (!resWhitespace.success) {
				expect(resWhitespace.error.issues[0]?.message).toBe(
					"Invalid domain name",
				);
			}
		});

		it("should reject invalid domain syntax", () => {
			const invalidDomains = [
				"http://",
				"https://",
				"not a domain",
				"http://   ",
				"://invalid",
			];

			for (const invalid of invalidDomains) {
				const result = domainSchema.safeParse(invalid);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0]?.message).toBe("Invalid domain name");
				}
			}
		});

		it("should reject non-string types", () => {
			expect(domainSchema.safeParse(123).success).toBe(false);
			expect(domainSchema.safeParse(null).success).toBe(false);
			expect(domainSchema.safeParse(undefined).success).toBe(false);
			expect(domainSchema.safeParse({}).success).toBe(false);
		});
	});

	describe("ipSchema", () => {
		it("should accept valid IPv4 addresses", () => {
			expect(ipSchema.parse("127.0.0.1")).toBe("127.0.0.1");
			expect(ipSchema.parse("192.168.1.1")).toBe("192.168.1.1");
			expect(ipSchema.parse("8.8.8.8")).toBe("8.8.8.8");
			expect(ipSchema.parse("10.0.0.254")).toBe("10.0.0.254");
			expect(ipSchema.parse("0.0.0.0")).toBe("0.0.0.0");
			expect(ipSchema.parse("255.255.255.255")).toBe("255.255.255.255");
		});

		it("should trim surrounding whitespace from IPv4 addresses", () => {
			expect(ipSchema.parse("   1.1.1.1   ")).toBe("1.1.1.1");
			expect(ipSchema.parse("\t10.0.0.1\n")).toBe("10.0.0.1");
		});

		it("should reject out-of-range octets", () => {
			const outOfRange = [
				"256.1.1.1",
				"192.168.1.256",
				"999.999.999.999",
				"300.0.0.1",
			];

			for (const ip of outOfRange) {
				const result = ipSchema.safeParse(ip);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0]?.message).toBe(
						"Enter a valid IPv4 address",
					);
				}
			}
		});

		it("should reject malformed IP formats", () => {
			const malformed = [
				"",
				"   ",
				"192.168.1",
				"192.168.1.1.1",
				"192.168.1.a",
				"192.168.-1.1",
				"example.com",
			];

			for (const ip of malformed) {
				const result = ipSchema.safeParse(ip);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0]?.message).toBe(
						"Enter a valid IPv4 address",
					);
				}
			}
		});

		it("should reject IPv6 addresses", () => {
			const ipv6List = [
				"::1",
				"fe80::1",
				"2001:0db8:85a3:0000:0000:8a2e:0370:7334",
			];

			for (const ip of ipv6List) {
				const result = ipSchema.safeParse(ip);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0]?.message).toBe(
						"Enter a valid IPv4 address",
					);
				}
			}
		});

		it("should reject non-string types", () => {
			expect(ipSchema.safeParse(12345).success).toBe(false);
			expect(ipSchema.safeParse(null).success).toBe(false);
			expect(ipSchema.safeParse(undefined).success).toBe(false);
		});
	});

	describe("sanitizeHostInput", () => {
		it("should strip protocols, paths, ports and trim/lowercase", () => {
			expect(sanitizeHostInput("https://Example.COM:8080/path/test")).toBe(
				"example.com",
			);
			expect(sanitizeHostInput("  HTTP://sub.test.org/api ")).toBe(
				"sub.test.org",
			);
			expect(sanitizeHostInput("192.168.1.1:3000")).toBe("192.168.1.1");
		});

		it("should handle non-string gracefully", () => {
			expect(sanitizeHostInput(null)).toBe("");
			expect(sanitizeHostInput(undefined)).toBe("");
		});
	});

	describe("cleanDomainSchema", () => {
		it("should sanitize and validate domain names", () => {
			expect(cleanDomainSchema.parse("https://EXAMPLE.com/login")).toBe(
				"example.com",
			);
			expect(cleanDomainSchema.parse(" api.github.com ")).toBe(
				"api.github.com",
			);
		});

		it("should reject invalid domain formats", () => {
			expect(cleanDomainSchema.safeParse("").success).toBe(false);
			expect(cleanDomainSchema.safeParse("invalid..domain").success).toBe(
				false,
			);
		});
	});

	describe("cleanTargetSchema", () => {
		it("should accept both domains and IPv4 addresses", () => {
			expect(cleanTargetSchema.parse("https://google.com/")).toBe("google.com");
			expect(cleanTargetSchema.parse(" 8.8.8.8:53 ")).toBe("8.8.8.8");
		});

		it("should reject invalid targets", () => {
			expect(cleanTargetSchema.safeParse("999.999.999.999").success).toBe(
				false,
			);
			expect(cleanTargetSchema.safeParse("not a domain").success).toBe(false);
		});
	});
});
