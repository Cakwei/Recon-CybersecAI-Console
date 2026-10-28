import { describe, expect, it } from "vitest";
import { normalizeFrontierText } from "../components/chat/cyber-chat";
import {
	analyzeSecurityDossier,
	generateHeuristicChatReply,
	streamSecurityChat,
} from "./ai-analyst";

describe("ai-analyst module", () => {
	const sampleData = {
		target: "acme-corp.com",
		grade: "C",
		score: 72,
		summary: "Moderate posture with configuration gaps detected.",
		risks: [
			{
				id: "dns-no-spf",
				severity: "medium",
				title: "Missing SPF (Sender Policy Framework) Record",
				description:
					"Without SPF, attackers can spoof emails from your domain.",
				category: "dns",
			},
			{
				id: "port-3306",
				severity: "high",
				title: "Exposed MySQL Database Port 3306",
				description: "MySQL service is open to the public internet.",
				category: "ports",
			},
		],
		openPorts: [80, 443, 3306],
		cves: ["CVE-2023-1234"],
		subdomainsCount: 5,
		provider: "auto" as const,
	};

	it("should generate a defensive security advisory with executive summary and playbook", async () => {
		const result = await analyzeSecurityDossier(sampleData);

		expect(result).toBeDefined();
		expect(result.analysis).toContain("acme-corp.com");
		expect(result.analysis).toContain("Executive Attack Surface Assessment");
		expect(result.analysis).toContain("Threat Vectors");
		expect(result.analysis).toContain("Hardening & Remediation Playbook");
		// Check that firewall commands are recommended for exposed ports
		expect(result.analysis).toContain("ufw allow 443/tcp");
		expect(result.analysis).toContain("Port 3306");
		// Check that DNS hardening is recommended
		expect(result.analysis).toContain("v=spf1");
		expect(result.provider).toBeDefined();
	});

	it("should provide a clean report when no risks are detected", async () => {
		const result = await analyzeSecurityDossier({
			target: "hardened.dev",
			grade: "A",
			score: 100,
			summary: "Strong security posture with minimal exposed attack surface.",
			risks: [],
			openPorts: [443],
			cves: [],
			subdomainsCount: 1,
			provider: "auto",
		});

		expect(result.analysis).toContain("hardened.dev");
		expect(result.analysis).toContain("No Critical Vulnerabilities Detected");
	});

	it("should reject explicit gemini request if GEMINI_API_KEY is missing", async () => {
		const originalGeminiKey = process.env.GEMINI_API_KEY;
		delete process.env.GEMINI_API_KEY;
		delete process.env.GOOGLE_API_KEY;

		try {
			await expect(
				analyzeSecurityDossier({
					...sampleData,
					provider: "gemini",
				}),
			).rejects.toThrow("GEMINI_API_KEY is not configured");
		} finally {
			if (originalGeminiKey) {
				process.env.GEMINI_API_KEY = originalGeminiKey;
			}
		}
	});

	it("should reject explicit anthropic request if ANTHROPIC_API_KEY is missing", async () => {
		const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		try {
			await expect(
				analyzeSecurityDossier({
					...sampleData,
					provider: "anthropic",
				}),
			).rejects.toThrow("ANTHROPIC_API_KEY is not configured");
		} finally {
			if (originalAnthropicKey) {
				process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
			}
		}
	});

	it("should generate heuristic chat replies tailored to specific topics", () => {
		const firewallReply = generateHeuristicChatReply(
			"How do I configure firewall UFW rules?",
			"target.com",
			{ openPorts: [80, 443, 3306], risks: [], cves: [] },
		);
		expect(firewallReply).toContain("Perimeter Firewall Lockdown");
		expect(firewallReply).toContain("sudo ufw");
		expect(firewallReply).toContain("Port 3306");

		const cveReply = generateHeuristicChatReply(
			"How to patch the CVEs?",
			"target.com",
			{ openPorts: [], risks: [], cves: ["CVE-2024-9999"] },
		);
		expect(cveReply).toContain("Vulnerability Mitigation & Patching");
		expect(cveReply).toContain("CVE-2024-9999");

		const dnsReply = generateHeuristicChatReply(
			"Configure SPF and DMARC",
			"target.com",
		);
		expect(dnsReply).toContain("v=spf1");
		expect(dnsReply).toContain("v=DMARC1");

		const sslReply = generateHeuristicChatReply(
			"How to harden TLS and Nginx?",
			"target.com",
		);
		expect(sslReply).toContain("TLS 1.3");
		expect(sslReply).toContain("Strict-Transport-Security");
	});

	it("should stream heuristic chunks smoothly for security chat in auto mode", async () => {
		const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
		const originalGeminiKey = process.env.GEMINI_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
		delete process.env.GEMINI_API_KEY;
		delete process.env.GOOGLE_API_KEY;

		try {
			const chunks: string[] = [];
			for await (const chunk of streamSecurityChat({
				messages: [
					{
						role: "user",
						content: "Generate UFW firewall rules for our ports",
					},
				],
				target: "secure-app.com",
				dossierContext: {
					grade: "C",
					score: 70,
					summary: "Exposed database detected",
					risks: [],
					openPorts: [80, 443, 5432],
					cves: [],
				},
				provider: "auto",
			})) {
				chunks.push(chunk);
			}

			const fullText = chunks.join("");
			expect(chunks.length).toBeGreaterThan(1);
			expect(fullText).toContain("sudo ufw");
			expect(fullText).toContain("5432");
		} finally {
			if (originalAnthropicKey)
				process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
			if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
		}
	});

	it("should reject explicit anthropic request if ANTHROPIC_API_KEY is missing", async () => {
		const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		try {
			await expect(
				analyzeSecurityDossier({
					...sampleData,
					provider: "anthropic",
				}),
			).rejects.toThrow("ANTHROPIC_API_KEY is not configured");
		} finally {
			if (originalAnthropicKey) {
				process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
			}
		}
	});

	it("should generate heuristic chat replies tailored to specific topics", () => {
		const firewallReply = generateHeuristicChatReply(
			"How do I configure firewall UFW rules?",
			"target.com",
			{ openPorts: [80, 443, 3306], risks: [], cves: [] },
		);
		expect(firewallReply).toContain("Perimeter Firewall Lockdown");
		expect(firewallReply).toContain("sudo ufw");
		expect(firewallReply).toContain("Port 3306");

		const cveReply = generateHeuristicChatReply(
			"How to patch the CVEs?",
			"target.com",
			{ openPorts: [], risks: [], cves: ["CVE-2024-9999"] },
		);
		expect(cveReply).toContain("Vulnerability Mitigation & Patching");
		expect(cveReply).toContain("CVE-2024-9999");

		const dnsReply = generateHeuristicChatReply(
			"Configure SPF and DMARC",
			"target.com",
		);
		expect(dnsReply).toContain("v=spf1");
		expect(dnsReply).toContain("v=DMARC1");

		const sslReply = generateHeuristicChatReply(
			"How to harden TLS and Nginx?",
			"target.com",
		);
		expect(sslReply).toContain("TLS 1.3");
		expect(sslReply).toContain("Strict-Transport-Security");
	});

	it("should stream heuristic chunks smoothly for security chat in auto mode", async () => {
		const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
		const originalGeminiKey = process.env.GEMINI_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
		delete process.env.GEMINI_API_KEY;
		delete process.env.GOOGLE_API_KEY;

		try {
			const chunks: string[] = [];
			for await (const chunk of streamSecurityChat({
				messages: [
					{
						role: "user",
						content: "Generate UFW firewall rules for our ports",
					},
				],
				target: "secure-app.com",
				dossierContext: {
					grade: "C",
					score: 70,
					summary: "Exposed database detected",
					risks: [],
					openPorts: [80, 443, 5432],
					cves: [],
				},
				provider: "auto",
			})) {
				chunks.push(chunk);
			}

			const fullText = chunks.join("");
			expect(chunks.length).toBeGreaterThan(1);
			expect(fullText).toContain("sudo ufw");
			expect(fullText).toContain("5432");
		} finally {
			if (originalAnthropicKey)
				process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
			if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
		}
	});

	it("should reject explicit anthropic request if ANTHROPIC_API_KEY is missing", async () => {
		const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		try {
			await expect(
				analyzeSecurityDossier({
					...sampleData,
					provider: "anthropic",
				}),
			).rejects.toThrow("ANTHROPIC_API_KEY is not configured");
		} finally {
			if (originalAnthropicKey) {
				process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
			}
		}
	});

	it("should strip [!IMPORTANT] and unwrap blockquotes into clean frontier LLM text", () => {
		const rawSample = `> "[!IMPORTANT] Identity Verification: Affirmative. I am the Antigravity Cyber Intelligence Analyst."`;
		const cleaned = normalizeFrontierText(rawSample);
		expect(cleaned).not.toContain("[!IMPORTANT]");
		expect(cleaned).not.toContain(">");
		expect(cleaned).toBe(
			"Identity Verification: Affirmative. I am the Antigravity Cyber Intelligence Analyst.",
		);

		const multiLineSample = `> [!NOTE]\n> Here is a normal paragraph.\n> Second line.`;
		const cleanedMulti = normalizeFrontierText(multiLineSample);
		expect(cleanedMulti).not.toContain("[!NOTE]");
		expect(cleanedMulti).not.toContain(">");
		expect(cleanedMulti).toContain("Here is a normal paragraph.\nSecond line.");
	});
});
