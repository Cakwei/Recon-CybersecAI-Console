import { createFileRoute } from "@tanstack/react-router";
import { type StreamChatInput, streamSecurityChat } from "#/lib/ai-analyst.ts";

export const Route = createFileRoute("/api/v1/ai/chat")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				POST: {
					handler: async ({ request }) => {
						try {
							const body = (await request.json()) as StreamChatInput;

							const stream = new ReadableStream({
								async start(controller) {
									const encoder = new TextEncoder();
									try {
										for await (const chunk of streamSecurityChat(body)) {
											controller.enqueue(encoder.encode(chunk));
										}
										controller.close();
									} catch (err: unknown) {
										const msg =
											err instanceof Error ? err.message : String(err);
										controller.enqueue(
											encoder.encode(`\n\n⚠️ **Stream Error:** ${msg}`),
										);
										controller.close();
									}
								},
							});

							return new Response(stream, {
								headers: {
									"Content-Type": "text/plain; charset=utf-8",
									"Cache-Control": "no-cache",
									"Transfer-Encoding": "chunked",
								},
							});
						} catch (err: unknown) {
							const msg = err instanceof Error ? err.message : String(err);
							return new Response(JSON.stringify({ error: msg }), {
								status: 400,
								headers: { "Content-Type": "application/json" },
							});
						}
					},
				},
			}),
	},
});
