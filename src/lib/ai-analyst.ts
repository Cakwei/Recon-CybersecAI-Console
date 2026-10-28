import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AiProvider = "anthropic" | "gemini" | "auto";

export interface AiAnalysisResult {
	analysis: string;
	provider: "anthropic" | "gemini" | "heuristic";
	model?: string;
	generatedAt: string;
}

export const auditPayloadSchema = z.object({
	target: z.string(),
	grade: z.string(),
	score: z.number(),
	summary: z.string(),
	risks: z.array(
		z.object({
			id: z.string(),
			severity: z.string(),
			title: z.string(),
			description: z.string(),
			category: z.string(),
		}),
	),
	openPorts: z.array(z.number()).default([]),
	cves: z.array(z.string()).default([]),
	subdomainsCount: z.number().default(0),
	provider: z.enum(["anthropic", "gemini", "auto"]).default("auto"),
});

// Fallback to structured defensive guidance when LLM API keys not set
function generateHeuristicAdvisory(
	data: z.infer<typeof auditPayloadSchema>,
): string {
	const { target, grade, score, risks, openPorts, cves } = data;

	const criticalRisks = risks.filter((r) => r.severity === "critical");
	const highRisks = risks.filter((r) => r.severity === "high");
	const mediumRisks = risks.filter((r) => r.severity === "medium");

	return `## 🛡️ Executive Attack Surface Assessment for \`${target}\`

**Current Posture Grade:** **${grade}** (${score}/100)  
${data.summary}

The external perimeter scan discovered **${risks.length} security observations** (${criticalRisks.length} critical, ${highRisks.length} high, ${mediumRisks.length} medium).

---

## 🎯 Threat Vectors & Vulnerability Prioritization

${
	criticalRisks.length > 0
		? `### 🚨 Critical Vulnerabilities (Immediate Action Required)
${criticalRisks.map((r) => `- **${r.title}**: ${r.description}`).join("\n")}`
		: "### ✅ No Critical Vulnerabilities Detected"
}

${
	highRisks.length > 0
		? `### ⚠️ High Severity Exposures
${highRisks.map((r) => `- **${r.title}**: ${r.description}`).join("\n")}`
		: ""
}

${
	mediumRisks.length > 0
		? `### 🔍 Medium & Configuration Findings
${mediumRisks.map((r) => `- **${r.title}**: ${r.description}`).join("\n")}`
		: ""
}

${
	cves.length > 0
		? `### 🪲 Discovered Common Vulnerabilities & Exposures (CVEs)
The public host exhibits the following cataloged CVEs in Shodan:
${cves.map((cve) => `- [${cve}](https://nvd.nist.gov/vuln/detail/${cve}): Consult vendor security patches immediately.`).join("\n")}`
		: ""
}

---

## 🔧 Hardening & Remediation Playbook

### 1. Perimeter Firewall Lockdown (UFW / iptables)
${
	openPorts.length > 0
		? `Restrict public exposure of internal services. Only ports 80 (HTTP) and 443 (HTTPS) should be generally open.

\`\`\`bash
# Deny incoming connections by default
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow standard web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

${openPorts
	.filter((p) => p !== 80 && p !== 443)
	.map(
		(p) =>
			`# Port ${p}: Restrict to your management VPN or office IP\n# sudo ufw allow from <TRUSTED_MANAGEMENT_IP> to any port ${p} proto tcp`,
	)
	.join("\n")}

# Enable firewall
sudo ufw enable
\`\`\``
		: "Ensure all unused network ports are blocked by default."
}

### 2. DNS & Anti-Spoofing Records
${
	risks.some((r) => r.category === "dns")
		? `Configure missing email authentication records in your authoritative DNS zone:

\`\`\`dns
; 1. Sender Policy Framework (SPF) TXT record
@   IN  TXT  "v=spf1 include:_spf.mx.cloudflare.net ~all"

; 2. DMARC Enforcement TXT record
_dmarc   IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${target}; pct=100; adkim=r; aspf=r"

; 3. Certificate Authority Authorization (CAA)
@   IN  CAA  0 issue "letsencrypt.org"
@   IN  CAA  0 iodef "mailto:security@${target}"
\`\`\``
		: "DNS hygiene is well-configured with active email protection."
}

### 3. Web Server TLS Hardening
${
	risks.some((r) => r.category === "ssl")
		? `Update your reverse proxy (Nginx) to enforce TLS 1.2+ and strong cipher suites:

\`\`\`nginx
# /etc/nginx/conf.d/security.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;

# Security Headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
\`\`\``
		: "SSL/TLS certificate configuration is healthy."
}`;
}

function buildSecurityPrompt(data: z.infer<typeof auditPayloadSchema>): string {
	return `You are a Principal Security Architect and Offensive Security Specialist.
Analyze the following reconnaissance and attack surface audit results for target: "${data.target}".

Scorecard:
- Overall Grade: ${data.grade} (${data.score}/100)
- Summary: ${data.summary}

Identified Vulnerabilities & Risks:
${data.risks.map((r) => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`).join("\n")}

Infrastructure Exposure:
- Publicly Discovered Ports: ${data.openPorts.length > 0 ? data.openPorts.join(", ") : "None cataloged"}
- Known CVEs: ${data.cves.length > 0 ? data.cves.join(", ") : "None cataloged"}
- Discovered Subdomains: ${data.subdomainsCount}

Produce a rigorous, highly actionable security analysis formatted in GitHub Flavored Markdown:
1. ## 🛡️ Executive Attack Surface Assessment
Briefly explain the posture, exposure, and business risk profile in plain English.

2. ## 🎯 Threat Vectors & Vulnerability Prioritization
Detail top exploit paths an adversary would attempt (e.g. brute-forcing open database ports, exploiting specific CVEs, leveraging missing SPF/DMARC for spear-phishing).

3. ## 🔧 Hardening & Remediation Playbook
Provide concrete, copy-pasteable configuration and commands:
- **Perimeter Firewall Lockdown** (e.g. ufw / iptables commands to close or whitelist sensitive ports)
- **Web Server & TLS Hardening** (Nginx/Apache modern cipher suite & security response headers)
- **Authoritative DNS Configuration** (exact SPF, DMARC, and CAA TXT records to publish)`;
}

export async function analyzeSecurityDossier(
	data: z.infer<typeof auditPayloadSchema>,
): Promise<AiAnalysisResult> {
	const requestedProvider = data.provider ?? "auto";
	const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
	const geminiApiKey =
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY ||
		process.env.GOOGLE_GENERATIVE_AI_API_KEY;

	const prompt = buildSecurityPrompt(data);

	// 1. Explicit Gemini Request
	if (requestedProvider === "gemini") {
		if (!geminiApiKey || geminiApiKey === "mock_key") {
			throw new Error(
				"GEMINI_API_KEY is not configured in the server environment (.env). Please set GEMINI_API_KEY or switch to Anthropic.",
			);
		}

		try {
			const { chat } = await import("@tanstack/ai");
			const { geminiText } = await import("@tanstack/ai-gemini");

			const adapter = geminiText("gemini-3.5-flash-lite");
			const response = await chat({
				adapter,
				messages: [{ role: "user", content: prompt }],
				stream: false,
			});

			const analysisText =
				typeof response === "string" ? response : String(response ?? "");

			if (analysisText.trim()) {
				return {
					analysis: analysisText,
					provider: "gemini",
					model: "gemini-3.5-flash-lite",
					generatedAt: new Date().toISOString(),
				};
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`Google Gemini analysis error: ${msg}`);
		}
	}

	// 2. Explicit Anthropic Request
	if (requestedProvider === "anthropic") {
		if (!anthropicApiKey || anthropicApiKey === "mock_key") {
			throw new Error(
				"ANTHROPIC_API_KEY is not configured in the server environment (.env). Please set ANTHROPIC_API_KEY or switch to Gemini.",
			);
		}

		try {
			const { chat } = await import("@tanstack/ai");
			const { anthropicText } = await import("@tanstack/ai-anthropic");

			const adapter = anthropicText("claude-sonnet-4-5");
			const response = await chat({
				adapter,
				messages: [{ role: "user", content: prompt }],
				stream: false,
			});

			const analysisText =
				typeof response === "string" ? response : String(response ?? "");

			if (analysisText.trim()) {
				return {
					analysis: analysisText,
					provider: "anthropic",
					model: "claude-sonnet-4-5",
					generatedAt: new Date().toISOString(),
				};
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`Anthropic Claude analysis error: ${msg}`);
		}
	}

	// 3. Auto Mode: Prefer Anthropic, then Gemini, then Heuristic
	if (anthropicApiKey && anthropicApiKey !== "mock_key") {
		try {
			const { chat } = await import("@tanstack/ai");
			const { anthropicText } = await import("@tanstack/ai-anthropic");

			const adapter = anthropicText("claude-sonnet-4-5");
			const response = await chat({
				adapter,
				messages: [{ role: "user", content: prompt }],
				stream: false,
			});

			const analysisText =
				typeof response === "string" ? response : String(response ?? "");

			if (analysisText.trim()) {
				return {
					analysis: analysisText,
					provider: "anthropic",
					model: "claude-sonnet-4-5",
					generatedAt: new Date().toISOString(),
				};
			}
		} catch (err) {
			console.warn("[ai-analyst] Anthropic failed in auto mode:", err);
		}
	}

	if (geminiApiKey && geminiApiKey !== "mock_key") {
		try {
			const { chat } = await import("@tanstack/ai");
			const { geminiText } = await import("@tanstack/ai-gemini");

			const adapter = geminiText("gemini-3.5-flash-lite");
			const response = await chat({
				adapter,
				messages: [{ role: "user", content: prompt }],
				stream: false,
			});

			const analysisText =
				typeof response === "string" ? response : String(response ?? "");

			if (analysisText.trim()) {
				return {
					analysis: analysisText,
					provider: "gemini",
					model: "gemini-3.5-flash-lite",
					generatedAt: new Date().toISOString(),
				};
			}
		} catch (err) {
			console.warn("[ai-analyst] Gemini failed in auto mode:", err);
		}
	}

	// Fallback to heuristic security advisory
	return {
		analysis: generateHeuristicAdvisory(data),
		provider: "heuristic",
		generatedAt: new Date().toISOString(),
	};
}

export const generateAiSecurityAnalysisServerFn = createServerFn({
	method: "POST",
})
	.validator((data: unknown) => auditPayloadSchema.parse(data))
	.handler(async ({ data }): Promise<AiAnalysisResult> => {
		return await analyzeSecurityDossier(data);
	});

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface StreamChatInput {
	messages: ChatMessage[];
	target?: string;
	dossierContext?: {
		grade?: string;
		score?: number;
		summary?: string;
		risks?: Array<{
			id?: string;
			severity: string;
			title: string;
			description: string;
			category?: string;
		}>;
		openPorts?: number[];
		cves?: string[];
		subdomainsCount?: number;
	};
	provider?: AiProvider;
}

export function buildSystemContext(input: StreamChatInput): string {
	const { target, dossierContext } = input;
	if (dossierContext && target) {
		const risks = dossierContext.risks ?? [];
		const ports = dossierContext.openPorts ?? [];
		const cves = dossierContext.cves ?? [];

		return `You are Antigravity Cyber Intelligence Analyst — an elite Principal Security Architect and Offensive/Defensive Cybersecurity Specialist.
Target under security audit: "${target}"
Posture Scorecard: Grade ${dossierContext.grade ?? "N/A"} (${dossierContext.score ?? 0}/100)
Executive Summary: ${dossierContext.summary ?? "Perimeter intelligence scan"}

Identified Vulnerabilities & Risks:
${risks.length > 0 ? risks.map((r) => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`).join("\n") : "None cataloged"}

Infrastructure Exposure:
- Public Ports Discovered: ${ports.length > 0 ? ports.join(", ") : "None cataloged"}
- Known CVEs: ${cves.length > 0 ? cves.join(", ") : "None cataloged"}
- Discovered Subdomains: ${dossierContext.subdomainsCount ?? 0}

Output Formatting Instructions:
1. Provide direct, natural conversational responses just like frontier LLMs (ChatGPT / Claude).
2. DO NOT use block quotes (never prefix output with '>' or wrap paragraphs in quotation marks). Output normal, direct body text.
3. DO NOT output alert tags (e.g., do NOT output [!IMPORTANT], [!NOTE], [!WARNING], or [!TIP]).
4. Format code using standard markdown code fences (e.g. \`\`\`bash, \`\`\`nginx, \`\`\`dns).
5. Keep explanations direct, rigorous, professional, and actionable.`;
	}

	return `You are Antigravity Cyber Intelligence Analyst — an elite Principal Security Architect and Offensive/Defensive Cybersecurity Specialist.
Provide authoritative cybersecurity advice, vulnerability analysis, incident response guidance, threat modeling, and copy-pasteable remediation configurations.
Output direct conversational Markdown like frontier LLMs: do NOT use block quotes ('>') and do NOT use alert tags like [!IMPORTANT].`;
}

export function generateHeuristicChatReply(
	query: string,
	target = "target.domain",
	context?: StreamChatInput["dossierContext"],
): string {
	const lower = query.toLowerCase();
	const openPorts = context?.openPorts ?? [];
	const cves = context?.cves ?? [];
	const risks = context?.risks ?? [];
	const grade = context?.grade ?? "B";
	const score = context?.score ?? 75;

	if (
		lower.includes("firewall") ||
		lower.includes("ufw") ||
		lower.includes("port") ||
		lower.includes("iptables")
	) {
		return `### 🛡️ Perimeter Firewall Lockdown Playbook for \`${target}\`

Based on external perimeter reconnaissance, discovered public ports: **${openPorts.length > 0 ? openPorts.join(", ") : "None cataloged"}**.

#### Recommended UFW Rule Set
Execute the following commands on the perimeter gateway or server:

\`\`\`bash
# 1. Reset and establish default drop policy
sudo ufw reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Allow essential encrypted services
sudo ufw allow 80/tcp comment 'HTTP (Let\\'s Encrypt validation)'
sudo ufw allow 443/tcp comment 'HTTPS (Web Application)'

# 3. Restrict management services (SSH / Admin / Databases)
${
	openPorts
		.filter((p) => p !== 80 && p !== 443)
		.map(
			(p) =>
				`# Port ${p}: Restrict to internal management VPN\nsudo ufw allow from 10.0.0.0/8 to any port ${p} proto tcp comment 'Internal management only'`,
		)
		.join("\n") || "# No unexpected open ports detected."
}

# 4. Enable firewall and verify status
sudo ufw enable
sudo ufw status verbose
\`\`\`

**Security Advisory:** Never expose internal databases or administrative ports (e.g. 22, 3306, 5432, 6379, 27017) directly to \`0.0.0.0/0\`. Always place them behind an encrypted VPN (WireGuard/Tailscale) or bastion host.`;
	}

	if (
		lower.includes("cve") ||
		lower.includes("vulnerabilit") ||
		lower.includes("patch")
	) {
		return `### 🪲 Vulnerability Mitigation & Patching Guide for \`${target}\`

${
	cves.length > 0
		? `The public perimeter exhibits **${cves.length} cataloged CVE(s)**:
${cves.map((cve) => `- **[${cve}](https://nvd.nist.gov/vuln/detail/${cve})**: High-priority patch recommended. Check vendor advisories.`).join("\n")}`
		: "No cataloged Shodan CVE signatures were matched against the host during the audit."
}

#### 📋 Immediate Patching Procedure

1. **Package Management Upgrade:**
\`\`\`bash
# Debian / Ubuntu
sudo apt-get update && sudo apt-get --with-new-pkgs upgrade -y

# RHEL / Rocky / AlmaLinux
sudo dnf check-update && sudo dnf upgrade -y
\`\`\`

2. **Automate Unattended Security Updates:**
\`\`\`bash
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
\`\`\`

3. **Verify Service Restart:**
Ensure services with patched libraries are restarted to clear in-memory execution of outdated binaries:
\`\`\`bash
sudo needrestart -u NeedRestart::UI::stdio
\`\`\``;
	}

	if (
		lower.includes("dns") ||
		lower.includes("spf") ||
		lower.includes("dmarc") ||
		lower.includes("dkim") ||
		lower.includes("email") ||
		lower.includes("caa")
	) {
		return `### 📧 Authoritative DNS Hardening & Anti-Spoofing for \`${target}\`

To protect domain reputation and prevent spear-phishing / CEO-fraud impersonation:

#### 1. SPF (Sender Policy Framework) Record
Publish a \`TXT\` record at the root zone:
\`\`\`dns
${target}.   IN   TXT   "v=spf1 include:_spf.mx.cloudflare.net ~all"
\`\`\`

#### 2. DMARC Enforcement Record
Publish a \`TXT\` record at \`_dmarc.${target}\`:
\`\`\`dns
_dmarc.${target}.   IN   TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${target}; ruf=mailto:dmarc-forensics@${target}; fo=1; pct=100; adkim=r; aspf=r"
\`\`\`
*Note: Start in \`p=quarantine\` mode before promoting to \`p=reject\` once aggregate reports confirm zero legitimate sender drops.*

#### 3. CAA (Certificate Authority Authorization) Record
Restrict TLS issuance to authorized CAs only:
\`\`\`dns
${target}.   IN   CAA   0 issue "letsencrypt.org"
${target}.   IN   CAA   0 issuewild ";"
${target}.   IN   CAA   0 iodef "mailto:security@${target}"
\`\`\``;
	}

	if (
		lower.includes("ssl") ||
		lower.includes("tls") ||
		lower.includes("cipher") ||
		lower.includes("header") ||
		lower.includes("nginx")
	) {
		return `### 🔒 Web Server TLS 1.3 & Security Headers for \`${target}\`

#### Modern Nginx TLS Configuration

\`\`\`nginx
# /etc/nginx/conf.d/security-headers.conf
server {
    listen 443 ssl http2;
    server_name ${target};

    # Modern TLS ciphers (Disable TLS 1.0 & 1.1)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';

    # Defense-in-depth HTTP Response Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none';" always;
}
\`\`\``;
	}

	// Default comprehensive response
	return `### 🛡️ Security Assessment & Recommendations for \`${target}\`

**Current Posture Grade:** **${grade}** (${score}/100)  
${context?.summary ?? "Comprehensive perimeter intelligence analysis."}

#### 🎯 Key Security Priorities
${
	risks.length > 0
		? risks
				.slice(0, 4)
				.map(
					(r) =>
						`- **[${r.severity.toUpperCase()}] ${r.title}**: ${r.description}`,
				)
				.join("\n")
		: "- No high-priority perimeter findings cataloged."
}

#### 💡 Suggested Action Items
1. **Perimeter Firewall**: Whitelist inbound traffic so only ports 80/443 are reachable by external clients.
2. **Email Security**: Validate SPF, DKIM, and DMARC enforcement records.
3. **Continuous Monitoring**: Configure routine vulnerability scanning on all exposed endpoints.

You can ask me to:
- *"Generate step-by-step UFW firewall rules"*
- *"Explain remediation for discovered CVEs"*
- *"Provide exact SPF and DMARC DNS records"*
- *"Generate Nginx TLS 1.3 hardened configuration"*`;
}

export async function* streamHeuristicResponse(
	text: string,
): AsyncGenerator<string, void, unknown> {
	const tokens = text.match(/\S+|\s+/g) || [text];
	const delay = process.env.NODE_ENV === "test" ? 1 : 14;
	for (let i = 0; i < tokens.length; i += 2) {
		const chunk = (tokens[i] ?? "") + (tokens[i + 1] ?? "");
		yield chunk;
		await new Promise((resolve) => setTimeout(resolve, delay));
	}
}

export async function* streamSecurityChat(
	input: StreamChatInput,
): AsyncGenerator<string, void, unknown> {
	const requestedProvider = input.provider ?? "auto";
	const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
	const geminiApiKey =
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY ||
		process.env.GOOGLE_GENERATIVE_AI_API_KEY;

	const messages = input.messages ?? [];
	const lastUserMessage =
		[...messages].reverse().find((m) => m.role === "user")?.content ?? "";

	const systemContext = buildSystemContext(input);

	const modelMessages: Array<{ role: "user" | "assistant"; content: string }> =
		[];
	if (messages.length > 0) {
		const first = messages[0];
		modelMessages.push({
			role: first.role,
			content: `${systemContext}\n\n---\n\n${first.content}`,
		});
		for (let i = 1; i < messages.length; i++) {
			modelMessages.push({
				role: messages[i].role,
				content: messages[i].content,
			});
		}
	} else {
		modelMessages.push({
			role: "user",
			content: `${systemContext}\n\nProvide an initial attack surface summary and mitigation checklist.`,
		});
	}

	// 1. Explicit Gemini
	if (requestedProvider === "gemini") {
		if (!geminiApiKey || geminiApiKey === "mock_key") {
			throw new Error(
				"GEMINI_API_KEY is not configured in the server environment (.env). Please set GEMINI_API_KEY or switch to Anthropic / Auto.",
			);
		}
		try {
			const { chat } = await import("@tanstack/ai");
			const { geminiText } = await import("@tanstack/ai-gemini");
			const adapter = geminiText("gemini-3.5-flash-lite");
			const stream = await chat({
				adapter,
				messages: modelMessages,
				stream: true,
			});

			for await (const chunk of stream) {
				if (
					"delta" in chunk &&
					typeof chunk.delta === "string" &&
					chunk.delta
				) {
					yield chunk.delta;
				}
			}
			return;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`Google Gemini streaming error: ${msg}`);
		}
	}

	// 2. Explicit Anthropic
	if (requestedProvider === "anthropic") {
		if (!anthropicApiKey || anthropicApiKey === "mock_key") {
			throw new Error(
				"ANTHROPIC_API_KEY is not configured in the server environment (.env). Please set ANTHROPIC_API_KEY or switch to Gemini / Auto.",
			);
		}
		try {
			const { chat } = await import("@tanstack/ai");
			const { anthropicText } = await import("@tanstack/ai-anthropic");
			const adapter = anthropicText("claude-sonnet-4-5");
			const stream = await chat({
				adapter,
				messages: modelMessages,
				stream: true,
			});

			for await (const chunk of stream) {
				if (
					"delta" in chunk &&
					typeof chunk.delta === "string" &&
					chunk.delta
				) {
					yield chunk.delta;
				}
			}
			return;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`Anthropic Claude streaming error: ${msg}`);
		}
	}

	// 3. Auto Mode: Anthropic -> Gemini -> Heuristic Stream
	if (anthropicApiKey && anthropicApiKey !== "mock_key") {
		try {
			const { chat } = await import("@tanstack/ai");
			const { anthropicText } = await import("@tanstack/ai-anthropic");
			const adapter = anthropicText("claude-sonnet-4-5");
			const stream = await chat({
				adapter,
				messages: modelMessages,
				stream: true,
			});

			for await (const chunk of stream) {
				if (
					"delta" in chunk &&
					typeof chunk.delta === "string" &&
					chunk.delta
				) {
					yield chunk.delta;
				}
			}
			return;
		} catch (err) {
			console.warn("[ai-analyst] Anthropic stream failed in auto mode:", err);
		}
	}

	if (geminiApiKey && geminiApiKey !== "mock_key") {
		try {
			const { chat } = await import("@tanstack/ai");
			const { geminiText } = await import("@tanstack/ai-gemini");
			const adapter = geminiText("gemini-3.5-flash-lite");
			const stream = await chat({
				adapter,
				messages: modelMessages,
				stream: true,
			});

			for await (const chunk of stream) {
				if (
					"delta" in chunk &&
					typeof chunk.delta === "string" &&
					chunk.delta
				) {
					yield chunk.delta;
				}
			}
			return;
		} catch (err) {
			console.warn("[ai-analyst] Gemini stream failed in auto mode:", err);
		}
	}

	// Fallback to heuristic streaming
	const heuristicText = generateHeuristicChatReply(
		lastUserMessage,
		input.target,
		input.dossierContext,
	);
	yield* streamHeuristicResponse(heuristicText);
}
