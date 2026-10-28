# 🛡️ Recon Console — Autonomous Attack Surface & Cyber Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React_19-teal?style=flat-square&logo=react)](https://tanstack.com/start)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/tests-89%20passed-success?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Biome](https://img.shields.io/badge/code_style-Biome-60A5FA?style=flat-square&logo=biome)](https://biomejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Recon Console** is an open-source, full-stack cybersecurity reconnaissance and external attack surface management (EASM) platform. It provides instant passive threat intelligence, multi-vector security audits, cryptographic posture checks, and an autonomous AI security analyst.

All reconnaissance queries are **strictly passive and non-intrusive**, pulling data from authoritative DNS records, Certificate Transparency logs, Shodan InternetDB, and WHOIS registries without port-knocking or active exploitation.

---

## ⚡ Key Features

### 1. 🛡️ Unified Attack Surface Audit (`/audit`)

- One-click composite intelligence audit across DNS, SSL/TLS, Shodan open ports, known CVEs, subdomains, and WHOIS.
- Computes an automated **A–F Security Scorecard** with a 0–100 numerical score, categorization of critical/high/medium/low risks, and copy-ready remediation CLI commands.

### 2. 🤖 Interactive AI Cyber Intelligence Analyst

- In-browser conversational copilot trained to provide context-aware technical advice, remediation steps, and NIST/CIS hardening standards.
- **Dynamic Model Switching:** Toggle seamlessly between **Google Gemini 2.5 Flash Lite** and **Anthropic Claude 3.5 Sonnet**.
- Rich markdown streaming with syntax highlighting, line numbers, and interactive code block copy/download buttons via `streamdown`.

### 3. 🌐 Passive Reconnaissance Suite

- **Host & Service Scan (`/scan`):** Identifies open listening ports, hostnames, CPEs, and unpatched CVEs via Shodan's free InternetDB.
- **DNS Deep Recon (`/dns`):** Inspects A, AAAA, MX, NS, SOA, and TXT records alongside defensive mail protocols (**SPF**, **DMARC**, **BIMI**, **MTA-STS**, **TLSRPT**).
- **SSL/TLS Audit (`/ssl`):** Validates X.509 certificate chains, expiration countdowns, CA issuer authorities, Subject Alternative Names (SANs), and cipher bit strength.
- **Passive Subdomain Enumeration (`/subdomains`):** Aggregates historical Certificate Transparency certificates (`crt.sh`) and verifies live hosts via DNS resolution.
- **Permutation Domain Enumeration (`/domain-enumeration`):** High-velocity dictionary permutation enumeration with wildcard DNS capture detection.
- **Authoritative WHOIS Lookup (`/whois`):** Domain registration timeline, expiration alerts, registrar info, and nameserver provider detection.

### 4. ⚡ Public REST API (v1)

- 7 programmatic REST endpoints with dual **`GET`** (query parameters) and **`POST`** (JSON payload) support.
- Automated URL/host extraction and sanitization (stripping `https://`, paths, and ports).
- In-browser interactive documentation explorer available at [`/docs`](file:///docs) and offline reference in [`docs/API.md`](docs/API.md).

---

## 🚀 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack SSR, Server Functions, Nitro engine)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library:** [React 19](https://react.dev/), [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Data:** [TanStack Store](https://tanstack.com/store), [TanStack Query](https://tanstack.com/query)
- **Forms & Rate Limiting:** [TanStack Form](https://tanstack.com/form), [TanStack Pacer](https://tanstack.com/pacer)
- **AI Streaming:** `@tanstack/ai`, `@tanstack/ai-gemini`, `@tanstack/ai-anthropic`, [Streamdown](https://github.com/streamdown)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Testing & Quality:** [Vitest](https://vitest.dev/) (89 unit/integration tests), [Biome](https://biomejs.dev/)

---

## 🛠️ Quick Start

### Prerequisites

- **Node.js:** `v20.x` or later
- **npm** (or `pnpm` / `bun`)

### 1. Clone the Repository

```bash
git clone https://github.com/Cakwei/cyber-ai-project.git
cd recon-console
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` to configure your API keys:

```env
# Optional: Model keys for AI Analyst chat
GEMINI_API_KEY="your-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional: Extended WHOIS & Shodan lookups
WHOIS_API_KEY="your-whoisjson-api-key"
SHODAN_API_KEY="your-shodan-api-key"
```

_(Note: Core features, Shodan InternetDB, and crt.sh will work even with minimal keys configured)._

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 REST API Reference

All endpoints accept both HTTP `GET` (query string) and `POST` (JSON body) and return uniform JSON envelopes.

| Endpoint                     | Methods       | Parameter        | Description                                                        |
| ---------------------------- | ------------- | ---------------- | ------------------------------------------------------------------ |
| `/api/v1/audit`              | `GET`, `POST` | `target`         | Comprehensive composite audit dossier with A–F scorecard.          |
| `/api/v1/subdomain`          | `GET`, `POST` | `domain`         | Passive subdomain enumeration via crt.sh + live DNS resolution.    |
| `/api/v1/ssl`                | `GET`, `POST` | `domain`         | X.509 SSL/TLS certificate validity, issuer, SANs, and cipher bits. |
| `/api/v1/dns`                | `GET`, `POST` | `domain`         | A, AAAA, MX, NS, SOA, TXT records and DMARC/BIMI enforcement.      |
| `/api/v1/domain-enumeration` | `GET`, `POST` | `domain`         | Permutation sub-domain discovery with wildcard DNS detection.      |
| `/api/v1/scan`               | `GET`, `POST` | `ip` or `target` | Shodan InternetDB open ports, hostnames, CPEs, and CVEs.           |
| `/api/v1/whois`              | `GET`, `POST` | `domainName`     | Domain registration, registrar info, and expiration countdown.     |

### Example cURL

```bash
# Unified Attack Surface Audit
curl -s "http://localhost:3000/api/v1/audit?target=example.com"

# Port & Vulnerability Scan via POST
curl -s -X POST "http://localhost:3000/api/v1/scan" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.1.1.1"}'
```

For full request/response schemas, TypeScript types, and code snippets, see the [Interactive Web Docs (`/docs`)](http://localhost:3000/docs) or the [Offline API Reference (`docs/API.md`)](docs/API.md).

---

## 🧪 Testing & Verification

The project includes unit and integration tests covering rate limiters, input sanitizers, AI analyst prompt assembly, and REST endpoints:

```bash
# Run unit & integration test suite
npm test

# Run Biome linter & code formatter check
npm run check

# Verify production build
npm run build
```

---

## 📁 Project Structure

```text
cyber-ai-project/
├── docs/                      # Offline REST API documentation (API.md)
├── src/
│   ├── components/            # UI components (Shadcn UI, Radix primitives)
│   │   ├── chat/              # AI Cyber Analyst streaming chat component
│   │   └── ui/                # Buttons, cards, badges, inputs, header, footer
│   ├── lib/                   # Core business logic, schemas, and API clients
│   │   ├── ai-analyst.ts      # LLM context builder & security analyst engine
│   │   ├── audit.ts           # Unified audit aggregator & scorecard logic
│   │   ├── schema.ts          # Zod validation & URL sanitization
│   │   ├── types.ts           # Centralized TypeScript definitions
│   │   ├── use-rate-limiter.ts# TanStack Pacer rate limiting hooks
│   │   └── whoisjson.ts       # External reconnaissance integrations
│   └── routes/                # TanStack Start file-based routing
│       ├── __root.tsx         # Root layout with Query and Router providers
│       ├── index.tsx          # Homepage reconnaissance console
│       ├── audit/             # Unified Target Dossier & Scorecard UI
│       ├── docs/              # Interactive REST API Documentation UI
│       ├── dashboard/         # Tool selection hub
│       ├── scan/              # Shodan port & CVE scanner UI
│       ├── dns/               # DNS recon & email defense UI
│       ├── ssl/               # SSL certificate audit UI
│       ├── subdomains/        # Subdomain enumeration UI
│       ├── whois/             # WHOIS lookup UI
│       └── api/v1/            # Public REST API routes (audit, dns, ssl, scan, etc.)
├── .env.example               # Example environment variable template
├── biome.json                 # Biome configuration
├── package.json               # Dependencies and scripts
└── vite.config.ts             # Vite, TanStack Start & Nitro setup
```

---

## ⚖️ Responsible Use & Disclaimer

This project is created for educational, defensive security auditing, and system administration purposes. Data is gathered strictly from public, non-intrusive sources and external APIs (such as Shodan InternetDB, Certificate Transparency, and public DNS). **Always ensure you have authorization before performing external security audits on domains or IP addresses you do not own.**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Ensure tests and formatting pass (`npm test && npm run check`).
5. Push to the Branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
