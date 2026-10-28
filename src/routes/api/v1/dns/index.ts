import { createFileRoute } from "@tanstack/react-router";
import { cleanDomainSchema } from "#/lib/schema.ts";
import { fetchDnsRecon } from "#/lib/whoisjson.ts";

export const Route = createFileRoute("/api/v1/dns/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const rawDomain =
								url.searchParams.get("domain") ||
								url.searchParams.get("target") ||
								url.searchParams.get("domainName") ||
								"";

							const parsed = cleanDomainSchema.safeParse(rawDomain);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid domain format.",
									},
									{ status: 400 },
								);
							}

							const data = await fetchDnsRecon(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error
									? err.message
									: "DNS reconnaissance failed.";
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
							const rawDomain =
								body.domain || body.target || body.domainName || "";

							const parsed = cleanDomainSchema.safeParse(rawDomain);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid domain format.",
									},
									{ status: 400 },
								);
							}

							const data = await fetchDnsRecon(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error
									? err.message
									: "DNS reconnaissance failed.";
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
