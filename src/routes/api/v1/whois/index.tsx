import { createFileRoute } from "@tanstack/react-router";
import { fetchWhoIsInfo } from "#/lib/utils.ts";

export const Route = createFileRoute("/api/v1/whois/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						const url = new URL(request.url);

						const domainName = url.searchParams.get("domainName") ?? "";

						if (!domainName)
							return Response.json({
								success: false,
								data: null,
								message: "",
							});
						const result = await fetchWhoIsInfo({ domainName });
						
						return Response.json({
							success: true,
							data: result,
							message: "",
						});
					},
				},
			}),
	},
});
