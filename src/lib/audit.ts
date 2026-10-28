import dns from "node:dns/promises";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchShodanHost } from "./server";
import type {
	DnsReconResult,
	DomainEnumerationResult,
	InternetDBResult,
	SslAuditResult,
} from "./types";
import { fetchWhoIsInfo } from "./utils";
import {
	cleanDomain,
	fetchDnsRecon,
	fetchDomainEnumeration,
	fetchSslAudit,
} from "./whoisjson";

export interface SecurityRisk {
	id: string;
	severity: "critical" | "high" | "medium" | "low" | "info";
	title: string;
	description: string;
	category: "ssl" | "dns" | "ports" | "cve" | "subdomains";
}

export interface SecurityScorecard {
	grade: "A" | "B" | "C" | "D" | "F";
	score: number;
	summary: string;
	risks: SecurityRisk[];
	metrics: {
		totalRisks: number;
		criticalCount: number;
		highCount: number;
		mediumCount: number;
		lowCount: number;
		openPortsCount: number;
		cvesCount: number;
		subdomainsCount: number;
		sslDaysLeft: number | null;
	};
}

export interface UnifiedAuditResult {
	target: string;
	cleanedTarget: string;
	isIp: boolean;
	resolvedIps: string[];
	scanTimestamp: string;
	scorecard: SecurityScorecard;
	ssl: SslAuditResult | null;
	dns: DnsReconResult | null;
	subdomains: DomainEnumerationResult | null;
	host: InternetDBResult | null;
	whois: unknown | null;
	errors: {
		ssl?: string;
		dns?: string;
		subdomains?: string;
		host?: string;
		whois?: string;
	};
}

const DANGEROUS_PORTS: Record<number, string> = {
	21: "FTP (Plaintext credentials)",
	23: "Telnet (Unencrypted remote administration)",
	25: "SMTP (Potential mail relay)",
	110: "POP3 (Plaintext authentication)",
	143: "IMAP (Plaintext authentication)",
	445: "SMB (High-risk file sharing, target for WannaCry/EternalBlue)",
	1433: "Microsoft SQL Server exposed publicly",
	1521: "Oracle Database exposed publicly",
	3306: "MySQL Database exposed publicly",
	3389: "RDP (Remote Desktop, high brute-force target)",
	5432: "PostgreSQL Database exposed publicly",
	5900: "VNC exposed publicly",
	6379: "Redis exposed without authentication",
	9200: "Elasticsearch cluster exposed publicly",
	27017: "MongoDB database exposed publicly",
};

// Calculates security grade (A-F), numerical score (0-100) & list of risks
export function calculateSecurityScorecard({
	ssl,
	dnsData,
	host,
	subdomains,
}: {
	ssl: SslAuditResult | null;
	dnsData: DnsReconResult | null;
	host: InternetDBResult | null;
	subdomains: DomainEnumerationResult | null;
}): SecurityScorecard {
	let score = 100;
	const risks: SecurityRisk[] = [];

	// SSL/TLS Audit Evaluation
	let sslDaysLeft: number | null = null;
	if (ssl) {
		if (!ssl.valid) {
			score -= 35;
			risks.push({
				id: "ssl-invalid",
				severity: "critical",
				title: "Invalid or Untrusted SSL/TLS Certificate",
				description:
					"The certificate for this domain failed trust validation or is self-signed/revoked.",
				category: "ssl",
			});
		} else if (ssl.valid_to) {
			const expiry = new Date(ssl.valid_to).getTime();
			const now = Date.now();
			const days = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
			sslDaysLeft = days;

			if (days < 0) {
				score -= 30;
				risks.push({
					id: "ssl-expired",
					severity: "critical",
					title: `SSL Certificate Expired (${Math.abs(days)} days ago)`,
					description:
						"The certificate has expired. Browsers will block access with security warnings.",
					category: "ssl",
				});
			} else if (days <= 14) {
				score -= 15;
				risks.push({
					id: "ssl-expiring-soon",
					severity: "high",
					title: `SSL Certificate Expires Soon (${days} days remaining)`,
					description:
						"Certificate expiration is imminent. Ensure auto-renewal is operational.",
					category: "ssl",
				});
			}
		}

		if (ssl.details?.bits && ssl.details.bits < 2048) {
			score -= 10;
			risks.push({
				id: "ssl-weak-key",
				severity: "medium",
				title: `Weak SSL Key Length (${ssl.details.bits}-bit)`,
				description:
					"RSA key lengths below 2048-bit are vulnerable to factoring attacks.",
				category: "ssl",
			});
		}
	}

	// DNS Hygiene Evaluation (Email Spoofing & DNSSEC)
	if (dnsData) {
		const txtRecords = dnsData.TXT ?? [];
		const hasSpf = txtRecords.some((txt) =>
			txt.toLowerCase().startsWith("v=spf1"),
		);
		const dmarcRecords = dnsData.DMARC ?? [];
		const hasDmarc = dmarcRecords.length > 0;

		if (!hasSpf) {
			score -= 10;
			risks.push({
				id: "dns-no-spf",
				severity: "medium",
				title: "Missing SPF (Sender Policy Framework) Record",
				description:
					"Without SPF, external mail servers cannot verify legitimate outgoing mail servers, enabling domain spoofing.",
				category: "dns",
			});
		}

		if (!hasDmarc) {
			score -= 10;
			risks.push({
				id: "dns-no-dmarc",
				severity: "medium",
				title: "Missing DMARC Record",
				description:
					"No DMARC policy found. Mail providers cannot enforce quarantine or rejection of phishing emails impersonating your domain.",
				category: "dns",
			});
		} else {
			const dmarcVal = dmarcRecords.join(" ").toLowerCase();
			if (dmarcVal.includes("p=none")) {
				score -= 5;
				risks.push({
					id: "dns-dmarc-none",
					severity: "low",
					title: "DMARC Policy Set to 'none' (Permissive)",
					description:
						"DMARC is running in monitoring-only mode. Phishing emails will still reach recipient inboxes.",
					category: "dns",
				});
			}
		}

		if (!dnsData.CAA || dnsData.CAA.length === 0) {
			score -= 3;
			risks.push({
				id: "dns-no-caa",
				severity: "low",
				title: "Missing CAA (Certificate Authority Authorization) Record",
				description:
					"Any public CA can issue certificates for this domain without restriction.",
				category: "dns",
			});
		}
	}

	// Host Open Ports & Known CVEs
	if (host) {
		const openPorts = host.ports ?? [];
		const cves = host.vulns ?? [];

		// Check dangerous ports
		for (const port of openPorts) {
			if (DANGEROUS_PORTS[port]) {
				score -= 12;
				risks.push({
					id: `port-${port}`,
					severity: "high",
					title: `Exposed High-Risk Port ${port}`,
					description: `${DANGEROUS_PORTS[port]} is publicly accessible from the internet.`,
					category: "ports",
				});
			}
		}

		// Check CVEs
		if (cves.length > 0) {
			if (cves.length >= 3) {
				score -= 30;
				risks.push({
					id: "cves-multiple",
					severity: "critical",
					title: `${cves.length} Known CVEs Detected on Public Host`,
					description: `Host exhibits vulnerabilities cataloged in Shodan InternetDB: ${cves.slice(0, 5).join(", ")}${cves.length > 5 ? "..." : ""}`,
					category: "cve",
				});
			} else {
				score -= 18;
				risks.push({
					id: "cves-found",
					severity: "high",
					title: `${cves.length} Known CVE Vulnerabilities Detected`,
					description: `Discovered CVEs: ${cves.join(", ")}`,
					category: "cve",
				});
			}
		}
	}

	// Subdomains Wildcard Detection
	if (subdomains?.wildcard_detected) {
		score -= 5;
		risks.push({
			id: "subdomain-wildcard",
			severity: "low",
			title: "DNS Wildcard Detected",
			description:
				"A wildcard DNS configuration answers requests for non-existent subdomains, which can mask shadow IT or subdomain takeover vectors.",
			category: "subdomains",
		});
	}

	// Normalize score
	const normalizedScore = Math.max(0, Math.min(100, score));

	let grade: "A" | "B" | "C" | "D" | "F";
	if (normalizedScore >= 90) grade = "A";
	else if (normalizedScore >= 80) grade = "B";
	else if (normalizedScore >= 70) grade = "C";
	else if (normalizedScore >= 55) grade = "D";
	else grade = "F";

	const criticalCount = risks.filter((r) => r.severity === "critical").length;
	const highCount = risks.filter((r) => r.severity === "high").length;
	const mediumCount = risks.filter((r) => r.severity === "medium").length;
	const lowCount = risks.filter((r) => r.severity === "low").length;

	let summary = "Strong security posture with minimal exposed attack surface.";
	if (criticalCount > 0) {
		summary = `Critical vulnerabilities detected (${criticalCount} critical, ${highCount} high). Immediate remediation required.`;
	} else if (highCount > 0) {
		summary = `Elevated risk posture with ${highCount} high-severity findings requiring remediation.`;
	} else if (mediumCount > 0) {
		summary = `Moderate posture with ${mediumCount} medium-priority configuration gaps detected.`;
	}

	return {
		grade,
		score: normalizedScore,
		summary,
		risks,
		metrics: {
			totalRisks: risks.length,
			criticalCount,
			highCount,
			mediumCount,
			lowCount,
			openPortsCount: host?.ports?.length ?? 0,
			cvesCount: host?.vulns?.length ?? 0,
			subdomainsCount: subdomains?.subdomains?.length ?? 0,
			sslDaysLeft,
		},
	};
}

const ipv4Regex =
	/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const auditInputSchema = z.object({
	target: z.string().trim().min(1, "Target domain or IP address is required"),
});

// Executes a full concurrent reconnaissance audit for a given domain or IP
export async function performUnifiedAudit(
	rawTarget: string,
): Promise<UnifiedAuditResult> {
	const cleaned = cleanDomain(rawTarget);
	if (!cleaned) {
		throw new Error("Please enter a valid domain name or IPv4 address.");
	}

	const isIp = ipv4Regex.test(cleaned);
	const resolvedIps: string[] = [];
	const errors: UnifiedAuditResult["errors"] = {};

	let sslResult: SslAuditResult | null = null;
	let dnsResult: DnsReconResult | null = null;
	let subdomainsResult: DomainEnumerationResult | null = null;
	let hostResult: InternetDBResult | null = null;
	let whoisResult: unknown = null;

	if (isIp) {
		resolvedIps.push(cleaned);
		// For an IP target, run Shodan Host scan
		try {
			hostResult = await fetchShodanHost(cleaned);
		} catch (err: unknown) {
			errors.host =
				err instanceof Error
					? err.message
					: "Could not query host intelligence.";
		}
	} else {
		// Target = domain name: run all reconnaissance queries in parallel
		const [
			resolvedIpResult,
			sslSettled,
			dnsSettled,
			subdomainsSettled,
			whoisSettled,
		] = await Promise.allSettled([
			dns.resolve4(cleaned),
			fetchSslAudit(cleaned),
			fetchDnsRecon(cleaned),
			fetchDomainEnumeration(cleaned),
			fetchWhoIsInfo({ domainName: cleaned }),
		]);

		if (resolvedIpResult.status === "fulfilled") {
			resolvedIps.push(...resolvedIpResult.value);
		}

		if (sslSettled.status === "fulfilled") {
			sslResult = sslSettled.value;
		} else {
			errors.ssl = sslSettled.reason?.message ?? "SSL audit unavailable";
		}

		if (dnsSettled.status === "fulfilled") {
			dnsResult = dnsSettled.value;
		} else {
			errors.dns =
				dnsSettled.reason?.message ?? "DNS reconnaissance unavailable";
		}

		if (subdomainsSettled.status === "fulfilled") {
			subdomainsResult = subdomainsSettled.value;
		} else {
			errors.subdomains =
				subdomainsSettled.reason?.message ??
				"Subdomain enumeration unavailable";
		}

		if (whoisSettled.status === "fulfilled") {
			whoisResult = whoisSettled.value;
		} else {
			errors.whois = whoisSettled.reason?.message ?? "WHOIS lookup unavailable";
		}

		const primaryIp = resolvedIps[0];
		if (primaryIp) {
			try {
				hostResult = await fetchShodanHost(primaryIp);
			} catch (err: unknown) {
				errors.host =
					err instanceof Error ? err.message : "Host lookup unavailable";
			}
		}
	}

	const scorecard = calculateSecurityScorecard({
		ssl: sslResult,
		dnsData: dnsResult,
		host: hostResult,
		subdomains: subdomainsResult,
	});

	return {
		target: rawTarget,
		cleanedTarget: cleaned,
		isIp,
		resolvedIps,
		scanTimestamp: new Date().toISOString(),
		scorecard,
		ssl: sslResult,
		dns: dnsResult,
		subdomains: subdomainsResult,
		host: hostResult,
		whois: whoisResult,
		errors,
	};
}

export const performUnifiedAuditServerFn = createServerFn({ method: "POST" })
	.validator((data) => auditInputSchema.parse(data))
	.handler(async ({ data }): Promise<UnifiedAuditResult> => {
		return await performUnifiedAudit(data.target);
	});
