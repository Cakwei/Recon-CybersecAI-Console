import { createServerFn } from "@tanstack/react-start";
import axios, { type AxiosError } from "axios";
import { z } from "zod";
import type {
	DnsReconResult,
	DomainEnumerationResult,
	SslAuditResult,
} from "./types";

export function cleanDomain(input: string): string {
	let cleaned = input.trim().toLowerCase();
	cleaned = cleaned.replace(/^https?:\/\//i, "");
	cleaned = cleaned.split("/")[0].split(":")[0];
	return cleaned;
}

function getApiKey(): string {
	const key = process.env.WHOIS_API_KEY;
	if (!key) {
		throw new Error(
			"WHOIS_API_KEY is not configured in the server environment (.env).",
		);
	}
	return key;
}

/**
 * Fetch SSL / TLS certificate details via WhoisJSON API
 */
export async function fetchSslAudit(
	rawDomain: string,
): Promise<SslAuditResult> {
	const domain = cleanDomain(rawDomain);
	if (!domain) {
		throw new Error("Please provide a valid domain name.");
	}

	const apiKey = getApiKey();

	try {
		const response = await axios.get<SslAuditResult>(
			"https://whoisjson.com/api/v1/ssl-cert-check",
			{
				params: { domain },
				headers: { Authorization: `TOKEN=${apiKey}` },
				timeout: 15000,
			},
		);

		if (!response.data) {
			throw new Error("No SSL certificate data returned from WhoisJSON.");
		}

		return response.data;
	} catch (err: unknown) {
		const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
		const msg =
			axiosErr.response?.data?.message ||
			axiosErr.response?.data?.error ||
			axiosErr.message ||
			"Failed to perform SSL/TLS audit.";
		throw new Error(`SSL/TLS Audit error for ${domain}: ${msg}`);
	}
}

/**
 * Fetch authoritative DNS records via WhoisJSON API
 */
export async function fetchDnsRecon(
	rawDomain: string,
): Promise<DnsReconResult> {
	const domain = cleanDomain(rawDomain);
	if (!domain) {
		throw new Error("Please provide a valid domain name.");
	}

	const apiKey = getApiKey();

	try {
		const response = await axios.get<DnsReconResult>(
			"https://whoisjson.com/api/v1/nslookup",
			{
				params: { domain },
				headers: { Authorization: `TOKEN=${apiKey}` },
				timeout: 15000,
			},
		);

		if (!response.data) {
			throw new Error("No DNS records returned from WhoisJSON.");
		}

		return {
			name: domain,
			...response.data,
		};
	} catch (err: unknown) {
		const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
		const msg =
			axiosErr.response?.data?.message ||
			axiosErr.response?.data?.error ||
			axiosErr.message ||
			"Failed to perform DNS reconnaissance.";
		throw new Error(`DNS Recon error for ${domain}: ${msg}`);
	}
}

/**
 * Enumerate subdomains via WhoisJSON parallel DNS brute-force
 */
export async function fetchDomainEnumeration(
	rawDomain: string,
): Promise<DomainEnumerationResult> {
	const domain = cleanDomain(rawDomain);
	if (!domain) {
		throw new Error("Please provide a valid domain name.");
	}

	const apiKey = getApiKey();

	try {
		const response = await axios.get<DomainEnumerationResult>(
			"https://whoisjson.com/api/v1/subdomains",
			{
				params: { domain },
				headers: { Authorization: `TOKEN=${apiKey}` },
				timeout: 25000,
			},
		);

		if (!response.data) {
			throw new Error("No subdomain enumeration data returned from WhoisJSON.");
		}

		return response.data;
	} catch (err: unknown) {
		const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
		const msg =
			axiosErr.response?.data?.message ||
			axiosErr.response?.data?.error ||
			axiosErr.message ||
			"Failed to enumerate subdomains.";
		throw new Error(`Domain enumeration error for ${domain}: ${msg}`);
	}
}

const domainInputSchema = z.object({
	domain: z.string().min(1, "Domain name is required"),
});

// TanStack Start Server Functions
export const auditSslServerFn = createServerFn({ method: "POST" })
	.validator((data: unknown) => domainInputSchema.parse(data))
	.handler(async ({ data }): Promise<SslAuditResult> => {
		return await fetchSslAudit(data.domain);
	});

export const reconDnsServerFn = createServerFn({ method: "POST" })
	.validator((data: unknown) => domainInputSchema.parse(data))
	.handler(async ({ data }): Promise<DnsReconResult> => {
		return await fetchDnsRecon(data.domain);
	});

export const enumerateDomainServerFn = createServerFn({ method: "POST" })
	.validator((data: unknown) => domainInputSchema.parse(data))
	.handler(async ({ data }): Promise<DomainEnumerationResult> => {
		return await fetchDomainEnumeration(data.domain);
	});
