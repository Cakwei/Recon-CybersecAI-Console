import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe, Lock, Network, Radar, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

interface Tool {
	name: string;
	description: string;
	icon: ReactNode;
	// Omit href for tools that aren't built yet — the card renders as disabled.
	href?: string;
}

const tools: Tool[] = [
	{
		name: "Port & Service Scan",
		description:
			"Look up open ports, hostnames, and known CVEs for any public IP via Shodan's InternetDB.",
		icon: <Radar className="h-5 w-5 text-(--link)" />,
		href: "/scan",
	},
	{
		name: "WHOIS Lookup",
		description:
			"Find details on a specific domain like registration date and registrar.",
		icon: <Search className="h-5 w-5 text-(--link)" />,
		href: "/whois",
	},
	{
		name: "DNS Recon",
		description:
			"Walk a domain's A, AAAA, MX, TXT, NS, SOA, and DMARC records via WhoisJSON.",
		icon: <Globe className="h-5 w-5 text-(--link)" />,
		href: "/dns",
	},
	{
		name: "SSL/TLS Audit",
		description:
			"Check certificate validity, expiry date, issuer authority, SANs, and cipher strength via WhoisJSON.",
		icon: <Lock className="h-5 w-5 text-(--link)" />,
		href: "/ssl",
	},
	{
		name: "Domain & Subdomain Enumeration",
		description:
			"Discover active subdomains with DNS resolution and wildcard detection via WhoisJSON.",
		icon: <Network className="h-5 w-5 text-(--link)" />,
		href: "/subdomains",
	},
];

function DashboardPage() {
	return (
		<div className="min-h-screen bg-[#0A0E13] text-[#DDE3E8]">
			<div className="mx-auto max-w-4xl px-6 py-16">
				<header className="mb-10">
					<p className="font-mono text-xs tracking-wide text-[#5B6A76]">
						Dashboard
					</p>
					<h1 className="mt-1 text-2xl font-semibold text-[#F3F6F8]">
						Choose a tool
					</h1>
					<p className="mt-2 text-sm text-[#8A98A3]">
						Each tool works the same way: enter a target, get a plain report
						back.
					</p>
				</header>

				{/* Featured Flagship: Unified Target Dossier */}
				<div className="mb-8">
					<Card
						className={`flex flex-col justify-between border-[#232B35] bg-[#12181F]`}
					>
						<div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Badge className="bg-(--link) text-white font-mono text-[10px] tracking-wide uppercase px-2 py-0.5">
										New
									</Badge>
									<Badge
										variant="outline"
										className="border-purple-500/40 text-purple-300 font-mono text-[10px] tracking-wide uppercase"
									>
										With AI Recommendations
									</Badge>
								</div>
								<h2 className="text-xl font-bold text-(--text) tracking-tight">
									Unified Attack Surface Audit & AI Analyst
								</h2>
								<p className="text-xs text-(--text-secondary) max-w-xl leading-relaxed">
									One-click composite scan running DNS recon, SSL audit,
									subdomain discovery, and Shodan CVE detection in parallel with
									an AI-synthesized risk scorecard and remediation commands.
								</p>
							</div>

							<Button
								asChild
								className="bg-(--link) hover:bg-(--link)/80 text-white font-medium text-xs px-5 shrink-0"
							>
								<Link to="/audit">
									Explore
									<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
								</Link>
							</Button>
						</div>
					</Card>
				</div>

				<div className="mb-4">
					<h3 className="text-xs font-mono tracking-wider uppercase text-(--text-secondary)">
						Individual Recon Tools
					</h3>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{tools.map((tool) => (
						<ToolCard key={tool.name} tool={tool} />
					))}
				</div>

				{/* Developer API Documentation Banner */}
				<div className="mt-12 rounded-xl border border-[#232B35] bg-[#12181F] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="border-(--link)/40 text-(--link) font-mono text-[10px] tracking-wide uppercase px-2 py-0.5"
							>
								Developer API
							</Badge>
							<Badge
								variant="outline"
								className="border-none text-(--text) font-mono text-[10px] tracking-wide uppercase px-2 py-0.5"
							>
								REST v1
							</Badge>
						</div>
						<h3 className="text-base font-semibold text-[#F3F6F8]">
							Programmatic Security Reconnaissance
						</h3>
						<p className="text-xs text-[#8A98A3] max-w-xl">
							All reconnaissance modules (Unified Audit, DNS, SSL, Subdomains,
							Shodan, and WHOIS) are accessible via high-performance REST
							endpoints with typed contracts.
						</p>
					</div>
					<Link to="/docs">
						<Button
							variant="outline"
							className="border-[#232B35] bg-[#0A0E13] text-(--text) hover:text-(--text)/80 hover:bg-(--bg-secondary) text-xs px-5 shrink-0"
						>
							API Documentation
							<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

function ToolCard({ tool }: { tool: Tool }) {
	const enabled = Boolean(tool.href);

	return (
		<Card
			className={`flex flex-col justify-between border-[#232B35] bg-[#12181F] ${
				enabled ? "" : "opacity-60"
			}`}
		>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#232B35] bg-[#161D25] text-[#4FBFA8]">
						{tool.icon}
					</div>
					{!enabled && (
						<Badge
							variant="outline"
							className="border-[#2C3742] text-[10px] text-[#7A8891]"
						>
							Coming soon
						</Badge>
					)}
				</div>
				<CardTitle className="pt-2 text-base text-[#F3F6F8]">
					{tool.name}
				</CardTitle>
				<CardDescription className="text-[#8A98A3]">
					{tool.description}
				</CardDescription>
			</CardHeader>

			<CardFooter>
				{enabled ? (
					<Link to={tool.href}>
						<Button className="w-full hover:text-(--text)/80 text-(--text) bg-(--link) text-xs hover:bg-(--link)/80">
							Open
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				) : (
					<Button
						disabled
						variant="secondary"
						className="w-full bg-[#1B2129] text-[#5B6A76]"
					>
						Not available yet
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
