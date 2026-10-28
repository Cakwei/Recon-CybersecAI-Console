import { z } from "zod";

export const domainSchema = z
	.string()
	.trim() // Remove accidental whitespace
	.transform((val) => {
		// If the user didn't type http:// or https://, default to https://
		if (!/^https?:\/\//i.test(val)) {
			return `https://${val}`;
		}
		return val;
	})
	.pipe(
		// Validate the transformed string is actually a valid URL
		z.url({ message: "Invalid domain name" }),
	);

export const ipSchema = z
	.string()
	.trim()
	.pipe(z.ipv4({ message: "Enter a valid IPv4 address" }));

export function sanitizeHostInput(raw: unknown): string {
	if (typeof raw !== "string") return "";
	let cleaned = raw.trim().toLowerCase();
	cleaned = cleaned.replace(/^https?:\/\//i, "");
	cleaned = cleaned.split("/")[0].split(":")[0];
	return cleaned;
}

export const cleanDomainSchema = z
	.string()
	.trim()
	.min(1, "Domain name is required")
	.transform(sanitizeHostInput)
	.refine(
		(val) => {
			if (!val) return false;
			return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z][a-z0-9-]*$/i.test(
				val,
			);
		},
		{ message: "Invalid domain format" },
	);

export const cleanTargetSchema = z
	.string()
	.trim()
	.min(1, "Target domain or IP address is required")
	.transform(sanitizeHostInput)
	.refine(
		(val) => {
			if (!val) return false;
			const isIpv4 =
				/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
					val,
				);
			const isDomain =
				/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z][a-z0-9-]*$/i.test(
					val,
				);
			return isIpv4 || isDomain;
		},
		{ message: "Must be a valid domain name or IPv4 address" },
	);
