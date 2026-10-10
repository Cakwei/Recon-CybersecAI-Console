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

				<div className="grid gap-4 sm:grid-cols-2">
					{tools.map((tool) => (
						<ToolCard key={tool.name} tool={tool} />
					))}
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
