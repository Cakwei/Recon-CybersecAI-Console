import type { ReactNode } from "react";

export type ReactProps = { children: ReactNode; className: string };

export interface InternetDBResult {
	ip: string;
	ports: number[];
	hostnames: string[];
	cpes: string[];
	tags: string[];
	vulns: string[];
}

export type IWhoIs = {
	domainName: string;
};

export interface SslAuditResult {
	domain: string;
	valid: boolean;
	valid_from: string;
	valid_to: string;
	issuer?: {
		C?: string;
		O?: string;
		CN?: string;
	};
	details?: {
		subject?: {
			CN?: string;
		};
		issuer?: {
			C?: string;
			O?: string;
			CN?: string;
		};
		subjectaltname?: string;
		bits?: number;
		asn1Curve?: string;
		nistCurve?: string;
		valid_from?: string;
		valid_to?: string;
		fingerprint?: string;
		fingerprint256?: string;
		fingerprint512?: string;
		serialNumber?: string;
		ext_key_usage?: string[];
		infoAccess?: {
			"CA Issuers - URI"?: string[];
			"OCSP - URI"?: string[];
		};
	};
}

export interface DnsMxRecord {
	exchange: string;
	priority: number;
}

export interface DnsSoaRecord {
	nsname?: string;
	hostmaster?: string;
	serial?: number;
	refresh?: number;
	retry?: number;
	expire?: number;
	minttl?: number;
}

export interface DnsReconResult {
	name?: string;
	A?: string[];
	AAAA?: string[];
	CAA?: string[];
	CNAME?: string[];
	MX?: DnsMxRecord[];
	NS?: string[];
	SOA?: DnsSoaRecord;
	TXT?: string[];
	DMARC?: string[];
	BIMI?: string[];
	MTASTS?: string[];
	TLSRPT?: string[];
}

export interface SubdomainItem {
	subdomain: string;
	type: string;
	ips: string[];
	status: string;
}

export interface DomainEnumerationResult {
	domain: string;
	wildcard_detected: boolean;
	total_found: number;
	scan_time_ms: number;
	subdomains: SubdomainItem[];
}

export interface SubdomainLookupResult {
	totalDiscovered: number;
	active: Array<{
		subdomain: string;
		addresses: string[];
	}>;
}

export interface WhoisData {
	name: string;
	status: string[];
	nameserver: string[];
	nsAnalysis?: {
		detectedProviders: string[];
	};
	ips?: string;
	created?: string;
	changed?: string;
	expires?: string;
	age?: {
		days: number;
		months: number;
		years: number;
	};
	expiration?: {
		daysLeft: number;
		isExpiringSoon: boolean;
		isExpired: boolean;
	};
	dnssec?: string;
	source?: string;
	registrar?: {
		name: string;
		email?: string | null;
	};
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: string;
	message?: string;
}

export interface HostScanApiResponse {
	success: boolean;
	data?: InternetDBResult;
	queriedTarget?: string;
	resolvedIp?: string;
	error?: string;
}
