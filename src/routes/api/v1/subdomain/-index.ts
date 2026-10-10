import dns from "node:dns/promises";
import { createServerFn } from "@tanstack/react-start";
import axios from "axios";
import { z } from "zod";
import { domainSchema } from "#/lib/schema.ts";

interface CrtEntry {
	name_value: string;
}

export const enumerateSubdomains = createServerFn({ method: "POST" })
	.validator(z.object({ domain: domainSchema }))
	.handler(async ({ data }) => {
		const { domain } = data;
		const cleanedDomain = domain.replace(/^https?:\/\//i, "");
		try {
			// 1. Query crt.sh JSON endpoint via Axios
			const response = await axios.get<CrtEntry[]>(
				`https://crt.sh/?q=%.${encodeURIComponent(cleanedDomain)}&output=json`,
				{
					/*
					timeout: 10000,
					headers: {
						"User-Agent": "SecurityScanner/1.0",
					},*/
				},
			);

			const subdomainResult = findSubdomains({
				cleanedDomain,
				axiosBodyData: response.data,
			});

			return subdomainResult;
			// ====
		} catch (err: any) {
			throw new Error(`Failed to enumerate subdomains: ${err.message}`);
		}
	});

export async function findSubdomains({
	cleanedDomain,
	axiosBodyData,
}: {
	cleanedDomain: string;
	axiosBodyData: any;
}) {
	// Parse and normalize candidate subdomains
	const candidates = new Set<string>();
	for (const entry of axiosBodyData) {
		// console.log(candidates);
		// crt.sh can return multiline or wildcard entries
		const names = entry.name_value.split("\n");
		for (const name of names) {
			const cleaned = name.trim().toLowerCase().replace(/^\*\./, "");

			if (cleaned.endsWith(cleanedDomain)) {
				candidates.add(cleaned);
			}
		}
	}

	// 3. Concurrently verify which subdomains currently resolve
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
