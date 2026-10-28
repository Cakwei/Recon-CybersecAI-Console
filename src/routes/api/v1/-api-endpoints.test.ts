import { describe, expect, it } from "vitest";
import { Route as AuditRoute } from "./audit/index";
import { Route as DnsRoute } from "./dns/index";
import { Route as DomainEnumRoute } from "./domain-enumeration/index";
import { Route as ScanRoute } from "./scan/index";
import { Route as SslRoute } from "./ssl/index";
import { Route as SubdomainRoute } from "./subdomain/index";
import { Route as WhoisRoute } from "./whois/index";

interface RouteWithServer {
	options: {
		server: {
			handlers: (ctx: {
				createHandlers: (h: unknown) => unknown;
			}) => Record<
				string,
				{ handler: (args: { request: Request }) => Promise<Response> }
			>;
		};
	};
}

function getRouteHandlers(route: unknown) {
	return (route as RouteWithServer).options.server.handlers({
		createHandlers: (h: unknown) => h,
	});
}

describe("Public REST API Endpoints", () => {
	describe("GET /api/v1/audit", () => {
		it("should reject missing or invalid target with 400", async () => {
			const handlers = getRouteHandlers(AuditRoute);
			const request = new Request("http://localhost/api/v1/audit?target=");
			const response = await handlers.GET.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
		});

		it("should accept valid domain target in GET", async () => {
			const handlers = getRouteHandlers(AuditRoute);
			const request = new Request(
				"http://localhost/api/v1/audit?target=https://hardened-test.dev:443/path",
			);
			const response = await handlers.GET.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.cleanedTarget).toBe("hardened-test.dev");
		});

		it("should accept valid domain target in POST", async () => {
			const handlers = getRouteHandlers(AuditRoute);
			const request = new Request("http://localhost/api/v1/audit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ target: "1.1.1.1" }),
			});
			const response = await handlers.POST.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.isIp).toBe(true);
		});
	});

	describe("GET /api/v1/subdomain", () => {
		it("should reject invalid domain syntax with 400", async () => {
			const handlers = getRouteHandlers(SubdomainRoute);
			const request = new Request(
				"http://localhost/api/v1/subdomain?domain=invalid..domain",
			);
			const response = await handlers.GET.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
		});
	});

	describe("GET /api/v1/scan", () => {
		it("should reject malformed IP or domain with 400", async () => {
			const handlers = getRouteHandlers(ScanRoute);
			const request = new Request(
				"http://localhost/api/v1/scan?ip=999.999.999.999",
			);
			const response = await handlers.GET.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
		});
	});

	describe("GET /api/v1/whois", () => {
		it("should reject missing domainName with 400", async () => {
			const handlers = getRouteHandlers(WhoisRoute);
			const request = new Request("http://localhost/api/v1/whois?domainName=");
			const response = await handlers.GET.handler({ request });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
		});
	});

	describe("Validation on SSL, DNS, and Domain-Enumeration", () => {
		it("SSL should reject invalid domains", async () => {
			const handlers = getRouteHandlers(SslRoute);
			const request = new Request(
				"http://localhost/api/v1/ssl?domain=not-a-valid-domain",
			);
			const response = await handlers.GET.handler({ request });
			expect(response.status).toBe(400);
		});

		it("DNS should reject invalid domains", async () => {
			const handlers = getRouteHandlers(DnsRoute);
			const request = new Request("http://localhost/api/v1/dns?domain=");
			const response = await handlers.GET.handler({ request });
			expect(response.status).toBe(400);
		});

		it("Domain Enumeration should reject invalid domains", async () => {
			const handlers = getRouteHandlers(DomainEnumRoute);
			const request = new Request(
				"http://localhost/api/v1/domain-enumeration",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ domain: "" }),
				},
			);
			const response = await handlers.POST.handler({ request });
			expect(response.status).toBe(400);
		});
	});
});
