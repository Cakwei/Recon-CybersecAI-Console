import { createFileRoute } from "@tanstack/react-router";
import { performUnifiedAudit } from "#/lib/audit.ts";
import { cleanTargetSchema } from "#/lib/schema.ts";

export const Route = createFileRoute("/api/v1/audit/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const rawTarget =
								url.searchParams.get("target") ||
								url.searchParams.get("domain") ||
								"";

							const parsed = cleanTargetSchema.safeParse(rawTarget);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid target. Please provide a valid domain name or IPv4 address.",
									},
									{ status: 400 },
								);
							}

							const data = await performUnifiedAudit(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "Unified audit failed.";
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
							const rawTarget = body.target || body.domain || "";

							const parsed = cleanTargetSchema.safeParse(rawTarget);
							if (!parsed.success) {
								return Response.json(
									{
										success: false,
										error:
											parsed.error.issues[0]?.message ||
											"Invalid target. Please provide a valid domain name or IPv4 address.",
									},
									{ status: 400 },
								);
							}

							const data = await performUnifiedAudit(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error ? err.message : "Unified audit failed.";
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
