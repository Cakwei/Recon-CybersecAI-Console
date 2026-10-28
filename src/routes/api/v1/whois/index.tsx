import { createFileRoute } from "@tanstack/react-router";
import { cleanDomainSchema } from "#/lib/schema.ts";
import { fetchWhoIsInfo } from "#/lib/utils.ts";

export const Route = createFileRoute("/api/v1/whois/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const rawDomain =
								url.searchParams.get("domainName") ||
								url.searchParams.get("domain") ||
								url.searchParams.get("target") ||
								"";

							const parsed = cleanDomainSchema.safeParse(rawDomain);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										data: null,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid domain format.",
										message: "Invalid domain format.",
									},
									{ status: 400 },
								);
							}

							const result = await fetchWhoIsInfo({ domainName: parsed.data });
							return Response.json({
								success: true,
								data: result,
								message: "",
							});
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "WHOIS lookup failed.";
							return Response.json(
								{
									success: false,
									data: null,
									error: message,
									message,
								},
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
								body.domainName || body.domain || body.target || "";

							const parsed = cleanDomainSchema.safeParse(rawDomain);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										data: null,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid domain format.",
										message: "Invalid domain format.",
									},
									{ status: 400 },
								);
							}

							const result = await fetchWhoIsInfo({ domainName: parsed.data });
							return Response.json({
								success: true,
								data: result,
								message: "",
							});
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "WHOIS lookup failed.";
							return Response.json(
								{
									success: false,
									data: null,
									error: message,
									message,
								},
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
