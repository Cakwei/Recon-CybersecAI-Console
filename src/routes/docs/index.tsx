import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Check,
	Code2,
	Copy,
	ExternalLink,
	Globe,
	Lock,
	Network,
	Radar,
	Search,
	Shield,
	Terminal,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/docs/")({
	component: ApiDocsPage,
});

interface EndpointParam {
	name: string;
	type: string;
	required: boolean;
	description: string;
	example: string;
}

interface EndpointDoc {
	id: string;
	title: string;
	path: string;
	methods: ("GET" | "POST")[];
	description: string;
	category: string;
	icon: React.ReactNode;
	parameters: EndpointParam[];
	requestBodySchema: string;
	tsTypes: string;
	curlGet: string;
	curlPost: string;
	exampleResponse: string;
}

const ENDPOINTS: EndpointDoc[] = [
	{
		id: "audit",
		title: "Unified Attack Surface Audit",
		path: "/api/v1/audit",
		methods: ["GET", "POST"],
		category: "Flagship",
		icon: <Shield className="h-4 w-4 text-(--link)" />,
		description:
			"Aggregates multi-vector passive reconnaissance across SSL/TLS, DNS, open ports, CVEs, subdomains, and WHOIS. Evaluates posture to generate an A–F security scorecard with numerical score (0–100) and prioritized security findings.",
		parameters: [
			{
				name: "target",
				type: "string",
				required: true,
				description:
					"Target domain name or IPv4 address. Schemes (https://), paths, and ports are stripped automatically.",
				example: "example.com",
			},
			{
				name: "domain",
				type: "string",
				required: false,
				description: "Alias for target.",
				example: "1.1.1.1",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				target: "example.com",
			},
			null,
			2,
		),
		tsTypes: `// Request
export interface AuditRequest {
  target: string;
}

// Scorecard & Findings
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

// Response
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

export interface AuditApiResponse {
  success: boolean;
  data: UnifiedAuditResult;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/audit?target=example.com"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/audit" \\
  -H "Content-Type: application/json" \\
  -d '{"target": "example.com"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "target": "example.com",
    "cleanedTarget": "example.com",
    "isIp": false,
    "resolvedIps": ["93.184.215.14"],
    "scanTimestamp": "2026-10-28T06:30:00.000Z",
    "scorecard": {
      "grade": "A",
      "score": 95,
      "summary": "Target exhibits solid security posture with minor recommendations.",
      "risks": [
        {
          "id": "dns-no-dmarc",
          "severity": "medium",
          "title": "Missing DMARC Policy",
          "description": "No DMARC record found in DNS. Enables domain email spoofing.",
          "category": "dns"
        }
      ],
      "metrics": {
        "totalRisks": 1,
        "criticalCount": 0,
        "highCount": 0,
        "mediumCount": 1,
        "lowCount": 0,
        "openPortsCount": 2,
        "cvesCount": 0,
        "subdomainsCount": 4,
        "sslDaysLeft": 72
      }
    },
    "ssl": { "valid": true, "valid_to": "2027-01-08" },
    "dns": { "A": ["93.184.215.14"] },
    "subdomains": { "total_found": 4 },
    "host": { "ports": [80, 443], "vulns": [] },
    "whois": { "name": "example.com" },
    "errors": {}
  }
}`,
	},
	{
		id: "subdomain",
		title: "Passive Subdomain Enumeration",
		path: "/api/v1/subdomain",
		methods: ["GET", "POST"],
		category: "Discovery",
		icon: <Network className="h-4 w-4 text-(--link)" />,
		description:
			"Extracts all certificates issued to subdomains via Certificate Transparency (crt.sh) and verifies live status using asynchronous DNS A record resolution.",
		parameters: [
			{
				name: "domain",
				type: "string",
				required: true,
				description:
					"Apex or root domain name (e.g. stripe.com). Protocol, paths, and ports are stripped.",
				example: "stripe.com",
			},
			{
				name: "domainName",
				type: "string",
				required: false,
				description: "Alias for domain.",
				example: "stripe.com",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				domain: "stripe.com",
			},
			null,
			2,
		),
		tsTypes: `// Response
export interface SubdomainItemActive {
  subdomain: string;
  addresses: string[];
}

export interface SubdomainLookupResult {
  totalDiscovered: number;
  active: SubdomainItemActive[];
}

export interface SubdomainApiResponse {
  success: boolean;
  data: SubdomainLookupResult;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/subdomain?domain=stripe.com"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/subdomain" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "stripe.com"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "totalDiscovered": 18,
    "active": [
      {
        "subdomain": "api.stripe.com",
        "addresses": ["54.187.159.182", "54.187.205.235"]
      },
      {
        "subdomain": "dashboard.stripe.com",
        "addresses": ["54.244.116.140"]
      }
    ]
  }
}`,
	},
	{
		id: "ssl",
		title: "SSL/TLS Certificate Audit",
		path: "/api/v1/ssl",
		methods: ["GET", "POST"],
		category: "Cryptography",
		icon: <Lock className="h-4 w-4 text-(--link)" />,
		description:
			"Examines public X.509 certificate chains: validity status, expiration timestamps, CA issuer, Subject Alternative Names (SANs), serial number, and cipher bit depth.",
		parameters: [
			{
				name: "domain",
				type: "string",
				required: true,
				description: "Domain name to inspect.",
				example: "github.com",
			},
			{
				name: "target",
				type: "string",
				required: false,
				description: "Alias for domain.",
				example: "github.com",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				domain: "github.com",
			},
			null,
			2,
		),
		tsTypes: `export interface SslIssuer {
  C?: string;
  O?: string;
  CN?: string;
}

export interface SslAuditResult {
  domain: string;
  valid: boolean;
  valid_from: string;
  valid_to: string;
  issuer?: SslIssuer;
  details?: {
    bits?: number;
    subjectaltname?: string;
    serialNumber?: string;
    ext_key_usage?: string[];
  };
}

export interface SslApiResponse {
  success: boolean;
  data: SslAuditResult;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/ssl?domain=github.com"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/ssl" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "github.com"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "domain": "github.com",
    "valid": true,
    "valid_from": "2026-03-01T00:00:00Z",
    "valid_to": "2027-03-15T23:59:59Z",
    "issuer": {
      "C": "US",
      "O": "DigiCert Inc",
      "CN": "DigiCert Global G2 TLS RSA SHA256 2020 CA1"
    },
    "details": {
      "bits": 2048,
      "subjectaltname": "DNS:github.com, DNS:www.github.com"
    }
  }
}`,
	},
	{
		id: "dns",
		title: "DNS Reconnaissance & Mail Defense",
		path: "/api/v1/dns",
		methods: ["GET", "POST"],
		category: "Infrastructure",
		icon: <Globe className="h-4 w-4 text-(--link)" />,
		description:
			"Queries authoritative DNS records including A, AAAA, MX, NS, SOA, TXT, and security posture enforcement mechanisms (DMARC, BIMI, MTA-STS, TLSRPT).",
		parameters: [
			{
				name: "domain",
				type: "string",
				required: true,
				description: "Target domain name.",
				example: "google.com",
			},
			{
				name: "target",
				type: "string",
				required: false,
				description: "Alias for domain.",
				example: "google.com",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				domain: "google.com",
			},
			null,
			2,
		),
		tsTypes: `export interface DnsMxRecord {
  exchange: string;
  priority: number;
}

export interface DnsReconResult {
  name?: string;
  A?: string[];
  AAAA?: string[];
  CAA?: string[];
  CNAME?: string[];
  MX?: DnsMxRecord[];
  NS?: string[];
  SOA?: {
    nsname?: string;
    hostmaster?: string;
    serial?: number;
  };
  TXT?: string[];
  DMARC?: string[];
  BIMI?: string[];
  MTASTS?: string[];
  TLSRPT?: string[];
}

export interface DnsApiResponse {
  success: boolean;
  data: DnsReconResult;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/dns?domain=google.com"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/dns" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "google.com"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "name": "google.com",
    "A": ["142.250.190.46"],
    "AAAA": ["2607:f8b0:4005:808::200e"],
    "MX": [{ "exchange": "smtp.google.com", "priority": 10 }],
    "NS": ["ns1.google.com", "ns2.google.com"],
    "TXT": ["v=spf1 include:_spf.google.com ~all"],
    "DMARC": ["v=DMARC1; p=reject; rua=mailto:mailauth-reports@google.com"]
  }
}`,
	},
	{
		id: "domain-enumeration",
		title: "Fast Permutation Domain Enumeration",
		path: "/api/v1/domain-enumeration",
		methods: ["GET", "POST"],
		category: "Discovery",
		icon: <Radar className="h-4 w-4 text-(--link)" />,
		description:
			"Discovers active subdomains through high-velocity DNS permutation and wordlist resolution, detecting wildcard DNS captures and measuring scan latency.",
		parameters: [
			{
				name: "domain",
				type: "string",
				required: true,
				description: "Domain name to enumerate.",
				example: "example.com",
			},
			{
				name: "target",
				type: "string",
				required: false,
				description: "Alias for domain.",
				example: "example.com",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				domain: "example.com",
			},
			null,
			2,
		),
		tsTypes: `export interface SubdomainItem {
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

export interface DomainEnumApiResponse {
  success: boolean;
  data: DomainEnumerationResult;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/domain-enumeration?domain=example.com"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/domain-enumeration" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "domain": "example.com",
    "wildcard_detected": false,
    "total_found": 3,
    "scan_time_ms": 384,
    "subdomains": [
      {
        "subdomain": "www.example.com",
        "type": "A",
        "ips": ["93.184.215.14"],
        "status": "active"
      }
    ]
  }
}`,
	},
	{
		id: "scan",
		title: "Shodan Host & Port Intelligence",
		path: "/api/v1/scan",
		methods: ["GET", "POST"],
		category: "Network",
		icon: <Terminal className="h-4 w-4 text-(--link)" />,
		description:
			"Queries Shodan InternetDB for open listening ports, Common Platform Enumerations (CPEs), infrastructure tags, and known Common Vulnerabilities and Exposures (CVEs). Accepts IPv4 directly or resolves domains automatically.",
		parameters: [
			{
				name: "ip",
				type: "string",
				required: true,
				description:
					"Target IPv4 address or domain name. Domains will be automatically resolved to their primary IPv4 address.",
				example: "1.1.1.1",
			},
			{
				name: "target",
				type: "string",
				required: false,
				description: "Alias for ip.",
				example: "cloudflare.com",
			},
			{
				name: "host",
				type: "string",
				required: false,
				description: "Alias for ip.",
				example: "1.1.1.1",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				ip: "1.1.1.1",
			},
			null,
			2,
		),
		tsTypes: `export interface InternetDBResult {
  ip: string;
  ports: number[];
  hostnames: string[];
  cpes: string[];
  tags: string[];
  vulns: string[];
}

export interface HostScanApiResponse {
  success: boolean;
  data: InternetDBResult;
  queriedTarget: string;
  resolvedIp: string;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/scan?ip=1.1.1.1"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/scan" \\
  -H "Content-Type: application/json" \\
  -d '{"ip": "1.1.1.1"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "ip": "1.1.1.1",
    "ports": [53, 80, 443, 853],
    "hostnames": ["one.one.one.one"],
    "cpes": [],
    "tags": ["dns"],
    "vulns": []
  },
  "queriedTarget": "1.1.1.1",
  "resolvedIp": "1.1.1.1"
}`,
	},
	{
		id: "whois",
		title: "WHOIS Domain Registration Lookup",
		path: "/api/v1/whois",
		methods: ["GET", "POST"],
		category: "Registry",
		icon: <Search className="h-4 w-4 text-(--link)" />,
		description:
			"Retrieves domain registration metadata from authoritative registry operators: creation date, last updated date, expiration date, countdown days, registrar name, and nameservers.",
		parameters: [
			{
				name: "domainName",
				type: "string",
				required: true,
				description: "Target domain name.",
				example: "wikipedia.org",
			},
			{
				name: "domain",
				type: "string",
				required: false,
				description: "Alias for domainName.",
				example: "wikipedia.org",
			},
			{
				name: "target",
				type: "string",
				required: false,
				description: "Alias for domainName.",
				example: "wikipedia.org",
			},
		],
		requestBodySchema: JSON.stringify(
			{
				domainName: "wikipedia.org",
			},
			null,
			2,
		),
		tsTypes: `export interface WhoisData {
  name: string;
  status: string[];
  nameserver: string[];
  created?: string;
  changed?: string;
  expires?: string;
  expiration?: {
    daysLeft: number;
    isExpiringSoon: boolean;
    isExpired: boolean;
  };
  registrar?: {
    name: string;
    email?: string | null;
  };
}

export interface WhoisApiResponse {
  success: boolean;
  data: WhoisData | null;
  message?: string;
  error?: string;
}`,
		curlGet: `curl -s "https://your-domain.com/api/v1/whois?domainName=wikipedia.org"`,
		curlPost: `curl -s -X POST "https://your-domain.com/api/v1/whois" \\
  -H "Content-Type: application/json" \\
  -d '{"domainName": "wikipedia.org"}'`,
		exampleResponse: `{
  "success": true,
  "data": {
    "name": "wikipedia.org",
    "status": ["clientDeleteProhibited", "clientTransferProhibited"],
    "nameserver": ["ns0.wikimedia.org", "ns1.wikimedia.org"],
    "created": "2001-01-13T00:12:14Z",
    "changed": "2023-11-20T17:41:03Z",
    "expires": "2027-01-13T00:12:14Z",
    "expiration": {
      "daysLeft": 442,
      "isExpiringSoon": false,
      "isExpired": false
    },
    "registrar": {
      "name": "MarkMonitor Inc.",
      "email": "abusecomplaints@markmonitor.com"
    }
  },
  "message": ""
}`,
	},
];

function ApiDocsPage() {
	const [selectedId, setSelectedId] = useState<string>("audit");
	const [activeMethodTab, setActiveMethodTab] = useState<"GET" | "POST">("GET");
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const activeEndpoint =
		ENDPOINTS.find((e) => e.id === selectedId) || ENDPOINTS[0];

	const handleCopy = (key: string, text: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		setTimeout(() => setCopiedKey(null), 2000);
	};

	return (
		<div className="min-h-screen bg-[#0A0E13] text-[#DDE3E8]">
			<div className="mx-auto max-w-6xl px-6 py-12">
				{/* Header */}
				<div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-[#232B35] pb-8">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Badge className="bg-(--link) text-white font-mono text-[10px] tracking-wide uppercase px-2 py-0.5">
								REST API v1
							</Badge>
							<Badge
								variant="outline"
								className="border-[#232B35] text-[#8A98A3] font-mono text-[10px]"
							>
								Public & Stateless
							</Badge>
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-[#F3F6F8]">
							API Documentation
						</h1>
						<p className="max-w-2xl text-sm text-[#8A98A3]">
							High-speed programmatic endpoints for passive cybersecurity
							reconnaissance, DNS inspection, SSL analysis, and attack surface
							auditing.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Link to="/audit">
							<Button
								variant="outline"
								size="sm"
								className="border-[#232B35] bg-[#12181F] text-xs text-[#DDE3E8] hover:bg-[#1C242E]"
							>
								Launch Web Audit
							</Button>
						</Link>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button
								size="sm"
								className="bg-(--link) hover:bg-(--link)/80 text-xs text-white"
							>
								GitHub Repo
								<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
							</Button>
						</a>
					</div>
				</div>

				{/* Architecture Highlights */}
				<div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card className="border-[#232B35] bg-[#12181F]">
						<CardContent className="p-4 space-y-1.5">
							<div className="flex items-center gap-2 text-xs font-semibold text-[#F3F6F8]">
								<Terminal className="h-4 w-4 text-(--link)" />
								Dual Method Flexibility
							</div>
							<p className="text-xs text-[#8A98A3]">
								Every endpoint supports both{" "}
								<code className="text-(--link)">GET</code> query strings and{" "}
								<code className="text-(--link)">POST</code> JSON payloads.
							</p>
						</CardContent>
					</Card>

					<Card className="border-[#232B35] bg-[#12181F]">
						<CardContent className="p-4 space-y-1.5">
							<div className="flex items-center gap-2 text-xs font-semibold text-[#F3F6F8]">
								<Shield className="h-4 w-4 text-emerald-400" />
								Automated Sanitization
							</div>
							<p className="text-xs text-[#8A98A3]">
								Schemes (<code>https://</code>), paths, and ports are stripped
								automatically before Zod validation.
							</p>
						</CardContent>
					</Card>

					<Card className="border-[#232B35] bg-[#12181F]">
						<CardContent className="p-4 space-y-1.5">
							<div className="flex items-center gap-2 text-xs font-semibold text-[#F3F6F8]">
								<Code2 className="h-4 w-4 text-purple-400" />
								Strict Type Contracts
							</div>
							<p className="text-xs text-[#8A98A3]">
								First-class TypeScript interfaces match all production backend
								handlers and client utilities.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Layout: Sidebar & Content */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* Navigation Sidebar */}
					<div className="lg:col-span-4 space-y-2">
						<div className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-[#5B6A76]">
							Available Endpoints ({ENDPOINTS.length})
						</div>
						<div className="space-y-1.5">
							{ENDPOINTS.map((endpoint) => {
								const isSelected = endpoint.id === selectedId;
								return (
									<button
										key={endpoint.id}
										type="button"
										onClick={() => {
											setSelectedId(endpoint.id);
											setActiveMethodTab("GET");
										}}
										className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
											isSelected
												? "border-(--link) bg-(--link)/10 text-white"
												: "border-[#232B35] bg-[#12181F] text-[#8A98A3] hover:border-[#384351] hover:text-[#F3F6F8]"
										}`}
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="p-1.5 rounded bg-[#0A0E13] border border-[#232B35]">
												{endpoint.icon}
											</div>
											<div className="truncate">
												<div className="text-xs font-medium text-[#F3F6F8] truncate">
													{endpoint.title}
												</div>
												<div className="font-mono text-[11px] text-[#5B6A76] truncate">
													{endpoint.path}
												</div>
											</div>
										</div>
										<Badge
											variant="outline"
											className="border-[#232B35] text-[10px] font-mono text-[#8A98A3]"
										>
											{endpoint.category}
										</Badge>
									</button>
								);
							})}
						</div>

						{/* AI Scope Callout */}
						<Card className="mt-6 border-[#232B35] bg-[#0E1319]">
							<CardContent className="p-4 space-y-2">
								<div className="flex items-center gap-2 text-xs font-medium text-amber-400">
									<AlertTriangle className="h-4 w-4 shrink-0" />
									Note on AI Analyst Scope
								</div>
								<p className="text-xs leading-relaxed text-[#8A98A3]">
									The conversational AI Analyst (<code>/api/v1/ai/chat</code>)
									streams contextual intelligence directly to the browser and is
									strictly internal to the interactive user interface.
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Endpoint Details Area */}
					<div className="lg:col-span-8 space-y-6">
						<Card className="border-[#232B35] bg-[#12181F]">
							<CardHeader className="p-6 border-b border-[#232B35] space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-semibold px-2">
											GET
										</Badge>
										<Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-xs font-semibold px-2">
											POST
										</Badge>
										<span className="font-mono text-sm font-semibold text-[#F3F6F8]">
											{activeEndpoint.path}
										</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy("path", activeEndpoint.path)}
										className="h-7 text-xs text-[#8A98A3] hover:text-white"
									>
										{copiedKey === "path" ? (
											<Check className="h-3.5 w-3.5 text-emerald-400" />
										) : (
											<Copy className="h-3.5 w-3.5" />
										)}
										<span className="ml-1.5 font-mono">Copy Path</span>
									</Button>
								</div>
								<p className="text-xs leading-relaxed text-[#8A98A3]">
									{activeEndpoint.description}
								</p>
							</CardHeader>

							<CardContent className="p-6 space-y-8">
								{/* Request Parameters Table */}
								<div className="space-y-3">
									<h3 className="text-xs font-mono uppercase tracking-wider text-[#5B6A76]">
										Request Parameters
									</h3>
									<div className="overflow-x-auto rounded-lg border border-[#232B35]">
										<table className="w-full text-left text-xs">
											<thead className="bg-[#0A0E13] text-[#8A98A3] border-b border-[#232B35]">
												<tr>
													<th className="py-2.5 px-3 font-mono">Field</th>
													<th className="py-2.5 px-3 font-mono">Type</th>
													<th className="py-2.5 px-3 font-mono">Required</th>
													<th className="py-2.5 px-3">Description</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-[#232B35] font-mono text-[#DDE3E8]">
												{activeEndpoint.parameters.map((param) => (
													<tr key={param.name} className="hover:bg-[#161E27]">
														<td className="py-2.5 px-3 text-(--link) font-semibold">
															{param.name}
														</td>
														<td className="py-2.5 px-3 text-[#5B6A76]">
															{param.type}
														</td>
														<td className="py-2.5 px-3">
															{param.required ? (
																<span className="text-amber-400">Yes</span>
															) : (
																<span className="text-[#5B6A76]">No</span>
															)}
														</td>
														<td className="py-2.5 px-3 font-sans text-xs text-[#8A98A3]">
															{param.description}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								{/* Interactive cURL Examples */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-xs font-mono uppercase tracking-wider text-[#5B6A76]">
											Example cURL Request
										</h3>
										<div className="flex items-center gap-1.5 bg-[#0A0E13] p-1 rounded-md border border-[#232B35]">
											<button
												type="button"
												onClick={() => setActiveMethodTab("GET")}
												className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
													activeMethodTab === "GET"
														? "bg-[#1C242E] text-white"
														: "text-[#8A98A3] hover:text-white"
												}`}
											>
												GET
											</button>
											<button
												type="button"
												onClick={() => setActiveMethodTab("POST")}
												className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
													activeMethodTab === "POST"
														? "bg-[#1C242E] text-white"
														: "text-[#8A98A3] hover:text-white"
												}`}
											>
												POST
											</button>
										</div>
									</div>

									<div className="relative rounded-lg bg-[#0A0E13] border border-[#232B35] p-4">
										<pre className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
											{activeMethodTab === "GET"
												? activeEndpoint.curlGet
												: activeEndpoint.curlPost}
										</pre>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy(
													"curl",
													activeMethodTab === "GET"
														? activeEndpoint.curlGet
														: activeEndpoint.curlPost,
												)
											}
											className="absolute top-2 right-2 h-7 px-2 text-xs text-[#8A98A3] hover:text-white bg-[#12181F] border border-[#232B35]"
										>
											{copiedKey === "curl" ? (
												<Check className="h-3.5 w-3.5 text-emerald-400" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
										</Button>
									</div>
								</div>

								{/* TypeScript Type Definitions */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-xs font-mono uppercase tracking-wider text-[#5B6A76]">
											TypeScript Types
										</h3>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy("types", activeEndpoint.tsTypes)
											}
											className="h-7 px-2 text-xs text-[#8A98A3] hover:text-white"
										>
											{copiedKey === "types" ? (
												<Check className="h-3.5 w-3.5 text-emerald-400" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
											<span className="ml-1 text-[11px] font-mono">
												Copy Types
											</span>
										</Button>
									</div>
									<div className="rounded-lg bg-[#0A0E13] border border-[#232B35] p-4 overflow-x-auto">
										<pre className="font-mono text-xs text-blue-300 leading-relaxed whitespace-pre">
											{activeEndpoint.tsTypes}
										</pre>
									</div>
								</div>

								{/* Example JSON Response */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<h3 className="text-xs font-mono uppercase tracking-wider text-[#5B6A76]">
												Response Payload
											</h3>
											<Badge
												variant="outline"
												className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]"
											>
												200 OK
											</Badge>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleCopy("resp", activeEndpoint.exampleResponse)
											}
											className="h-7 px-2 text-xs text-[#8A98A3] hover:text-white"
										>
											{copiedKey === "resp" ? (
												<Check className="h-3.5 w-3.5 text-emerald-400" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
											<span className="ml-1 text-[11px] font-mono">
												Copy JSON
											</span>
										</Button>
									</div>
									<div className="rounded-lg bg-[#0A0E13] border border-[#232B35] p-4 max-h-96 overflow-y-auto">
										<pre className="font-mono text-xs text-[#F3F6F8] leading-relaxed whitespace-pre">
											{activeEndpoint.exampleResponse}
										</pre>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* HTTP Error Schemas */}
						<Card className="border-[#232B35] bg-[#12181F]">
							<CardHeader className="p-5 border-b border-[#232B35]">
								<CardTitle className="text-sm font-semibold text-[#F3F6F8]">
									Error Responses & Validation
								</CardTitle>
							</CardHeader>
							<CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge
											variant="outline"
											className="border-amber-500/30 text-amber-400 font-mono text-[10px]"
										>
											400 Bad Request
										</Badge>
										<span className="text-xs text-[#8A98A3]">
											Malformed Target or Invalid TLD
										</span>
									</div>
									<div className="rounded bg-[#0A0E13] border border-[#232B35] p-3">
										<pre className="font-mono text-xs text-amber-300">
											{JSON.stringify(
												{
													success: false,
													error:
														"Invalid target. Please provide a valid domain name or IPv4 address.",
												},
												null,
												2,
											)}
										</pre>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge
											variant="outline"
											className="border-red-500/30 text-red-400 font-mono text-[10px]"
										>
											500 Server Error
										</Badge>
										<span className="text-xs text-[#8A98A3]">
											Upstream API / DNS Failure
										</span>
									</div>
									<div className="rounded bg-[#0A0E13] border border-[#232B35] p-3">
										<pre className="font-mono text-xs text-red-300">
											{JSON.stringify(
												{
													success: false,
													error:
														"Upstream registry timeout or resolution failure.",
												},
												null,
												2,
											)}
										</pre>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
