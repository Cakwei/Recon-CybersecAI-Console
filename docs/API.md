# Antigravity Cyber Recon REST API Documentation

Comprehensive technical reference for the public REST API endpoints exposed by the Antigravity Cyber Intelligence platform.

---

## 1. Overview & Architecture

The Antigravity REST API provides high-speed, programmatic access to passive cybersecurity reconnaissance, network asset discovery, cryptographic posture evaluation, and automated attack surface auditing.

### Key Characteristics
- **Public & Stateless:** All listed reconnaissance endpoints are publicly accessible without authentication tokens or cookies.
- **Strict Sanitization:** Inputs undergo automated extraction, protocol stripping (`http://`, `https://`), trailing slash/path/query parameter stripping, and port removal before validation.
- **Dual Method Support:** Every endpoint supports both HTTP `GET` (for query string automation and browser previews) and HTTP `POST` (for programmatic JSON payloads).
- **Safe Passive Intelligence:** Reconnaissance is strictly passive or non-intrusive (relying on public Certificate Transparency logs, authoritative DNS queries, Shodan InternetDB, and WhoisJSON registries). No active exploitation, intrusive port knocking, or aggressive scanning is performed.
- **AI Analyst Scope:** The AI Cyber Intelligence Analyst (`/api/v1/ai/chat`) is an internal web-session streaming service and is strictly excluded from this public REST API contract.

---

## 2. Base URL & Common Conventions

```http
Base URL: https://<your-host>/api/v1
Local Development: http://localhost:3000/api/v1
```

### Standard Response Envelope
All API endpoints return responses structured in a consistent JSON envelope:

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": { ... }
}
```

#### Client Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Human-readable description of validation failure."
}
```

#### Server Error Response (`500 Internal Server Error`)
```json
{
  "success": false,
  "error": "Detailed error message describing upstream or resolution failure."
}
```

---

## 3. Input Validation & Sanitization Engine

All input parameters undergo uniform sanitization before validation:

| Input Pattern | Sanitized Result | Note |
|---|---|---|
| `https://example.com/api/v1?test=1` | `example.com` | Strips scheme, path, query strings |
| `sub.target.co.uk:8443` | `sub.target.co.uk` | Strips explicit port numbers |
| `http://1.1.1.1:8080/path` | `1.1.1.1` | Strips scheme, port, path for IP targets |
| `   EXAMPLE.COM   ` | `example.com` | Lowercased and whitespace trimmed |

### Accepted Identifiers
1. **Domain Names:** Fully qualified domain name (FQDN) containing valid labels and an alphabetical TLD (e.g. `example.com`, `api.github.com`).
2. **IPv4 Addresses:** Valid four-octet IPv4 address ranging from `0.0.0.0` to `255.255.255.255`.

---

## 4. Endpoints Summary

| Endpoint | HTTP Methods | Accepted Parameters | Description |
|---|---|---|---|
| [`/api/v1/audit`](#1-unified-attack-surface-audit) | `GET`, `POST` | `target` (or `domain`) | Full attack surface dossier: SSL, DNS, ports, CVEs, subdomains, WHOIS, and security scorecard (A–F). |
| [`/api/v1/subdomain`](#2-passive-subdomain-enumeration) | `GET`, `POST` | `domain` (or `domainName`) | Passive subdomain discovery via Certificate Transparency (`crt.sh`) verified against live DNS A records. |
| [`/api/v1/ssl`](#3-ssltls-certificate-audit) | `GET`, `POST` | `domain` (or `target`) | Deep cryptographic analysis: certificate validity, expiry, CA issuer, SANs, and key strength. |
| [`/api/v1/dns`](#4-dns-reconnaissance) | `GET`, `POST` | `domain` (or `target`) | Exhaustive DNS record inspection: A, AAAA, MX, NS, SOA, TXT, DMARC, BIMI, MTA-STS, TLSRPT. |
| [`/api/v1/domain-enumeration`](#5-domain--wildcard-enumeration) | `GET`, `POST` | `domain` (or `target`) | High-speed dictionary permutation enumeration with DNS wildcard detection and response timing. |
| [`/api/v1/scan`](#6-host-network-scan) | `GET`, `POST` | `ip` (or `target`, `host`) | Open ports, Shodan tags, CPEs, hostnames, and known CVEs for any IPv4 address or resolved hostname. |
| [`/api/v1/whois`](#7-whois-registration-lookup) | `GET`, `POST` | `domainName` (or `domain`, `target`) | Domain ownership, registrar name, creation date, expiration countdown, and nameserver analysis. |

---

## 5. Detailed Endpoint Specifications

### 1. Unified Attack Surface Audit
Orchestrates a comprehensive security audit across all vectors in parallel and generates an overall security scorecard (A–F grade, 0–100 numerical score, and prioritized risk breakdown).

- **Route:** `/api/v1/audit`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name or IPv4 address.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `target` | `string` | Yes | Query param or JSON body | Domain name (e.g. `github.com`) or IPv4 address (e.g. `1.1.1.1`). |
| `domain` | `string` | Optional alias | Query param or JSON body | Alias for `target`. |

#### TypeScript Types
```typescript
export interface AuditRequest {
  target: string;
}

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

export interface AuditApiResponse {
  success: boolean;
  data?: UnifiedAuditResult;
  error?: string;
}
```

#### Example cURL
```bash
# GET Request
curl -s "https://your-domain.com/api/v1/audit?target=example.com"

# POST Request
curl -s -X POST "https://your-domain.com/api/v1/audit" \
  -H "Content-Type: application/json" \
  -d '{"target": "1.1.1.1"}'
```

#### Example 200 OK Response
```json
{
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
}
```

---

### 2. Passive Subdomain Enumeration
Queries public Certificate Transparency (CT) logs via `crt.sh` to extract historical and current subdomains, and actively tests live DNS resolution (`node:dns/promises`) to filter for live responsive hosts.

- **Route:** `/api/v1/subdomain`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `domain` | `string` | Yes | Query param or JSON body | Fully qualified root domain (e.g. `example.com`). |
| `domainName` | `string` | Optional alias | Query param or JSON body | Alias for `domain`. |

#### TypeScript Types
```typescript
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
  data?: SubdomainLookupResult;
  error?: string;
}
```

#### Example cURL
```bash
# GET
curl -s "https://your-domain.com/api/v1/subdomain?domain=stripe.com"

# POST
curl -s -X POST "https://your-domain.com/api/v1/subdomain" \
  -H "Content-Type: application/json" \
  -d '{"domain": "stripe.com"}'
```

#### Example 200 OK Response
```json
{
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
}
```

---

### 3. SSL/TLS Certificate Audit
Inspects SSL certificate chains, validity dates, Subject Alternative Names (SANs), CA issuer authorities, key bit-length, and cryptographic curves.

- **Route:** `/api/v1/ssl`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `domain` | `string` | Yes | Query param or JSON body | Domain name to audit (e.g. `cloudflare.com`). |
| `target` | `string` | Optional alias | Query param or JSON body | Alias for `domain`. |

#### TypeScript Types
```typescript
export interface SslIssuer {
  C?: string;
  O?: string;
  CN?: string;
}

export interface SslDetails {
  subject?: { CN?: string };
  issuer?: SslIssuer;
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
}

export interface SslAuditResult {
  domain: string;
  valid: boolean;
  valid_from: string;
  valid_to: string;
  issuer?: SslIssuer;
  details?: SslDetails;
}

export interface SslApiResponse {
  success: boolean;
  data?: SslAuditResult;
  error?: string;
}
```

#### Example cURL
```bash
# GET
curl -s "https://your-domain.com/api/v1/ssl?domain=github.com"

# POST
curl -s -X POST "https://your-domain.com/api/v1/ssl" \
  -H "Content-Type: application/json" \
  -d '{"domain": "github.com"}'
```

#### Example 200 OK Response
```json
{
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
      "subjectaltname": "DNS:github.com, DNS:www.github.com",
      "ext_key_usage": ["Server Authentication", "Client Authentication"]
    }
  }
}
```

---

### 4. DNS Reconnaissance
Performs deep querying across all primary authoritative DNS records as well as email and domain security enforcement configurations (DMARC, BIMI, MTA-STS, TLSRPT).

- **Route:** `/api/v1/dns`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `domain` | `string` | Yes | Query param or JSON body | Domain name to inspect (e.g. `google.com`). |
| `target` | `string` | Optional alias | Query param or JSON body | Alias for `domain`. |

#### TypeScript Types
```typescript
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

export interface DnsApiResponse {
  success: boolean;
  data?: DnsReconResult;
  error?: string;
}
```

#### Example cURL
```bash
# GET
curl -s "https://your-domain.com/api/v1/dns?domain=google.com"

# POST
curl -s -X POST "https://your-domain.com/api/v1/dns" \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com"}'
```

#### Example 200 OK Response
```json
{
  "success": true,
  "data": {
    "name": "google.com",
    "A": ["142.250.190.46"],
    "AAAA": ["2607:f8b0:4005:808::200e"],
    "MX": [
      { "exchange": "smtp.google.com", "priority": 10 }
    ],
    "NS": ["ns1.google.com", "ns2.google.com", "ns3.google.com", "ns4.google.com"],
    "TXT": ["v=spf1 include:_spf.google.com ~all"],
    "DMARC": ["v=DMARC1; p=reject; rua=mailto:mailauth-reports@google.com"]
  }
}
```

---

### 5. Domain & Wildcard Enumeration
Runs wordlist and permutation sub-domain checks, identifying wildcard DNS traps and timing benchmarks.

- **Route:** `/api/v1/domain-enumeration`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `domain` | `string` | Yes | Query param or JSON body | Target domain name. |
| `target` | `string` | Optional alias | Query param or JSON body | Alias for `domain`. |

#### TypeScript Types
```typescript
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

export interface DomainEnumApiResponse {
  success: boolean;
  data?: DomainEnumerationResult;
  error?: string;
}
```

#### Example cURL
```bash
# GET
curl -s "https://your-domain.com/api/v1/domain-enumeration?domain=example.com"

# POST
curl -s -X POST "https://your-domain.com/api/v1/domain-enumeration" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

---

### 6. Host Network Scan
Queries Shodan's InternetDB for passive network intelligence regarding open listening ports, Common Platform Enumerations (CPEs), infrastructure tags, and known Common Vulnerabilities and Exposures (CVEs).

- **Route:** `/api/v1/scan`
- **Methods:** `GET`, `POST`
- **Target Type:** IPv4 address or Domain name (domain names are automatically resolved to their primary IPv4 address).

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `ip` | `string` | Yes | Query param or JSON body | Target IPv4 address or domain name. |
| `target` | `string` | Optional alias | Query param or JSON body | Alias for `ip`. |
| `host` | `string` | Optional alias | Query param or JSON body | Alias for `ip`. |

#### TypeScript Types
```typescript
export interface InternetDBResult {
  ip: string;
  ports: number[];
  hostnames: string[];
  cpes: string[];
  tags: string[];
  vulns: string[];
}

export interface HostScanApiResponse {
  success: boolean;
  data?: InternetDBResult;
  queriedTarget?: string;
  resolvedIp?: string;
  error?: string;
}
```

#### Example cURL
```bash
# GET (IPv4 address)
curl -s "https://your-domain.com/api/v1/scan?ip=1.1.1.1"

# POST (Domain target auto-resolved to IPv4)
curl -s -X POST "https://your-domain.com/api/v1/scan" \
  -H "Content-Type: application/json" \
  -d '{"ip": "cloudflare.com"}'
```

#### Example 200 OK Response
```json
{
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
}
```

---

### 7. WHOIS Registration Lookup
Retrieves authoritative registration records, registrar attribution, lifecycle milestones (creation, updated, expiration dates), days until expiration, and DNSSEC status.

- **Route:** `/api/v1/whois`
- **Methods:** `GET`, `POST`
- **Target Type:** Domain name.

#### Parameters
| Parameter | Type | Required | Transport | Description |
|---|---|---|---|---|
| `domainName` | `string` | Yes | Query param or JSON body | Target domain name (e.g. `wikipedia.org`). |
| `domain` | `string` | Optional alias | Query param or JSON body | Alias for `domainName`. |
| `target` | `string` | Optional alias | Query param or JSON body | Alias for `domainName`. |

#### TypeScript Types
```typescript
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

export interface WhoisApiResponse {
  success: boolean;
  data: WhoisData | null;
  message?: string;
  error?: string;
}
```

#### Example cURL
```bash
# GET
curl -s "https://your-domain.com/api/v1/whois?domainName=wikipedia.org"

# POST
curl -s -X POST "https://your-domain.com/api/v1/whois" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "wikipedia.org"}'
```

#### Example 200 OK Response
```json
{
  "success": true,
  "data": {
    "name": "wikipedia.org",
    "status": ["clientDeleteProhibited", "clientTransferProhibited", "clientUpdateProhibited"],
    "nameserver": ["ns0.wikimedia.org", "ns1.wikimedia.org", "ns2.wikimedia.org"],
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
}
```

---

## 6. HTTP Status & Error Codes

| Status Code | Reason | Cause & Remedy |
|---|---|---|
| `200 OK` | Success | The query completed normally and response payload is populated. |
| `400 Bad Request` | Validation Error | The provided target was blank, improperly formed, not a valid domain name, or not a valid IPv4 address. Check the `error` field in response. |
| `500 Internal Error` | Upstream Failure | Upstream registry or external service experienced a timeout or network resolution failure. |

#### Error Payload Schema
```json
{
  "success": false,
  "error": "Invalid target format. Provide an IPv4 address or domain."
}
```

---

## 7. Rate Limiting & Integration Guidelines

- **Stateless:** Requests can be made concurrently across multiple threads.
- **Client Retries:** For automated scripts, exponential backoff (e.g. 500ms, 1000ms, 2000ms) is recommended if upstream third-party registries return transient network errors.
- **Respect Upstream Registries:** While the API is public, automated crawlers should maintain reasonable concurrency (e.g. 5–10 requests per second) to preserve third-party CT and DNS rate limits.

