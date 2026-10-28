import dns from "node:dns/promises";
import { createFileRoute } from "@tanstack/react-router";
import { cleanTargetSchema } from "#/lib/schema.ts";
import { fetchShodanHost } from "#/lib/server.ts";

const ipv4Regex =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

async function resolveToIp(target: string): Promise<string> {
	if (ipv4Regex.test(target)) {
		return target;
	}
	const addresses = await dns.resolve4(target);
	if (!addresses || addresses.length === 0) {
		throw new Error(
			`Could not resolve hostname "${target}" to an IPv4 address.`,
		);
	}
	return addresses[0];
}

export const Route = createFileRoute("/api/v1/scan/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const rawTarget =
								url.searchParams.get("ip") ||
								url.searchParams.get("target") ||
								url.searchParams.get("host") ||
								"";

							const parsed = cleanTargetSchema.safeParse(rawTarget);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid target format. Provide an IPv4 address or domain.",
									},
									{ status: 400 },
								);
							}

							const ip = await resolveToIp(parsed.data);
							const data = await fetchShodanHost(ip);
							return Response.json({
								success: true,
								data,
								queriedTarget: parsed.data,
								resolvedIp: ip,
							});
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "Host scan failed.";
							return Response.json(
								{ success: false, error: message },
								{ status: 500 },
							);
						}
					},
				},
				POST: {
					handler: async ({ request }) => {
						try {
							const body = await request.json().catch(() => ({}));
							const rawTarget = body.ip || body.target || body.host || "";

							const parsed = cleanTargetSchema.safeParse(rawTarget);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid target format. Provide an IPv4 address or domain.",
									},
									{ status: 400 },
								);
							}

							const ip = await resolveToIp(parsed.data);
							const data = await fetchShodanHost(ip);
							return Response.json({
								success: true,
								data,
								queriedTarget: parsed.data,
								resolvedIp: ip,
							});
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "Host scan failed.";
							return Response.json(
								{ success: false, error: message },
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
