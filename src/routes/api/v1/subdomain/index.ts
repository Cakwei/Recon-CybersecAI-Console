import dns from "node:dns/promises";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import axios from "axios";
import { z } from "zod";
import { cleanDomainSchema, domainSchema } from "#/lib/schema.ts";

interface CrtEntry {
	name_value: string;
}

export async function findSubdomains({
	cleanedDomain,
	axiosBodyData,
}: {
	cleanedDomain: string;
	axiosBodyData: CrtEntry[];
}) {
	const candidates = new Set<string>();
	for (const entry of axiosBodyData) {
		const names = entry.name_value.split("\n");
		for (const name of names) {
			const cleaned = name.trim().toLowerCase().replace(/^\*\./, "");

			if (cleaned.endsWith(cleanedDomain)) {
				candidates.add(cleaned);
			}
		}
	}

	const resolvedResults = await Promise.allSettled(
		Array.from(candidates).map(async (sub) => {
			const addresses = await dns.resolve4(sub);
			return { subdomain: sub, addresses };
		}),
	);

	const activeSubdomains = resolvedResults
		.filter(
			(
				result,
			): result is PromiseFulfilledResult<{
				subdomain: string;
				addresses: string[];
			}> => result.status === "fulfilled",
		)
		.map((r) => r.value);

	return {
		totalDiscovered: candidates.size,
		active: activeSubdomains,
	};
}

export async function runSubdomainEnumeration(domain: string) {
	const cleanedDomain = domain
		.replace(/^https?:\/\//i, "")
		.trim()
		.toLowerCase();
	const response = await axios.get<CrtEntry[]>(
		`https://crt.sh/?q=%.${encodeURIComponent(cleanedDomain)}&output=json`,
	);

	return await findSubdomains({
		cleanedDomain,
		axiosBodyData: response.data ?? [],
	});
}

export const enumerateSubdomains = createServerFn({ method: "POST" })
	.validator(z.object({ domain: domainSchema }))
	.handler(async ({ data }) => {
		try {
			return await runSubdomainEnumeration(data.domain);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to enumerate subdomains";
			throw new Error(`Failed to enumerate subdomains: ${message}`);
		}
	});

export const Route = createFileRoute("/api/v1/subdomain/")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const rawDomain =
								url.searchParams.get("domain") ||
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

							const data = await runSubdomainEnumeration(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error
									? err.message
									: "Subdomain enumeration failed.";
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
							const rawDomain = body.domain || body.domainName || "";

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

							const data = await runSubdomainEnumeration(parsed.data);
							return Response.json({ success: true, data });
						} catch (err: unknown) {
							const message =
								err instanceof Error
									? err.message
									: "Subdomain enumeration failed.";
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
