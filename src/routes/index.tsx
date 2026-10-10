import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Globe,
	Lock,
	Network,
	Radar,
	Search,
	ShieldCheck,
	Terminal,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<Hero />
			<Features />
			<HowItWorks />
			<ToolsPreview />
			<ClosingCta />
		</div>
	);
}

function Hero() {
	return (
		<section className="mx-auto max-w-2xl px-6 py-24">
			<p className="font-mono text-xs tracking-wide text-(--text-secondary)">
				Personal Security Toolkit
			</p>
			<h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
				A console for the checks you run on a host before you trust it.
			</h1>
			<p className="mt-4 max-w-lg text-(--text-secondary)">
				Open ports, exposed services, known CVEs — pulled from public sources
				like Shodan's InternetDB, in one place instead of scattered across tabs.
			</p>

			<div className="mt-8">
				<Button
					asChild
					className="hover:text-(--text)/80 text-(--text) bg-(--link) hover:bg-(--link)/80"
				>
					<Link to="/dashboard" className="text-xs">
						Open dashboard
						<ArrowRight className="ml-1.5 h-4 w-4" />
					</Link>
				</Button>
			</div>
		</section>
	);
}

function Features() {
	return (
		<section className="border-t border-border">
			<div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-3">
				<Feature
					icon={<Radar className="h-4 w-4" />}
					title="Passive lookups"
					text="No packets sent to the target — data comes from indexes like Shodan."
				/>
				<Feature
					icon={<Terminal className="h-4 w-4" />}
					title="One console"
					text="Every tool lives behind the same dashboard, same report format."
				/>
				<Feature
					icon={<ShieldCheck className="h-4 w-4" />}
					title="Built to grow"
					text="Start with port scanning, add DNS, TLS, and subdomain tools over time."
				/>
			</div>
		</section>
	);
}

function Feature({
	icon,
	title,
	text,
}: {
	icon: ReactNode;
	title: string;
	text: string;
}) {
	return (
		<div>
			<div className="mb-2 flex items-center gap-1.5 text-(--link)">{icon}</div>
			<h3 className="text-sm font-medium text-(--text)">{title}</h3>
			<p className="mt-1 text-xs leading-relaxed text-(--text-secondary)">
				{text}
			</p>
		</div>
	);
}

function HowItWorks() {
	const steps = [
		{
			title: "Pick a tool",
			text: "Choose the check you need from the dashboard — port scan, DNS, TLS, and more as they ship.",
		},
		{
			title: "Enter a target",
			text: "Drop in an IP or domain. Nothing is stored beyond your current session.",
		},
		{
			title: "Read the report",
			text: "Results come back in the same plain layout every time, so you can scan them fast.",
		},
	];

	return (
		<section className="border-t border-border bg-(--bg-secondary)">
			<div className="mx-auto max-w-4xl px-6 py-16">
				<h2 className="text-xl font-semibold">How it works</h2>
				<div className="mt-8 grid gap-8 sm:grid-cols-3">
					{steps.map((step, i) => (
						<div key={step.title}>
							<span className="font-mono text-xs text-(--link)">0{i + 1}</span>
							<h3 className="mt-2 text-sm font-medium text-(--text)">
								{step.title}
							</h3>
							<p className="mt-1 text-xs leading-relaxed text-(--text-secondary)">
								{step.text}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function ToolsPreview() {
	const tools = [
		{
			name: "Port & Service Scan",
			text: "Open ports, hostnames, and known CVEs via Shodan InternetDB.",
			icon: <Radar className="h-4 w-4" />,
			status: "Available",
			href: "/scan",
		},
		{
			name: "WHOIS Lookup",
			text: "Find domain registration dates, nameservers, and registrar.",
			icon: <Search className="h-4 w-4" />,
			status: "Available",
			href: "/whois",
		},
		{
			name: "DNS Recon",
			text: "Walk a domain's A, AAAA, MX, TXT, NS, SOA, and DMARC records.",
			icon: <Globe className="h-4 w-4" />,
			status: "Available",
			href: "/dns",
		},
		{
			name: "SSL/TLS Audit",
			text: "Certificate validity, expiry timeline, cipher strength, and SANs.",
			icon: <Lock className="h-4 w-4" />,
			status: "Available",
			href: "/ssl",
		},
		{
			name: "Domain & Subdomain Enumeration",
			text: "Discover active subdomains with DNS resolution and wildcard detection.",
			icon: <Network className="h-4 w-4" />,
			status: "Available",
			href: "/subdomains",
		},
	];

	return (
		<section className="border-t border-border">
			<div className="mx-auto max-w-4xl px-6 py-16">
				<div className="flex items-baseline justify-between">
					<h2 className="text-xl font-semibold">What's inside</h2>
					<Link
						to="/dashboard"
						className="text-sm text-(--link) underline-offset-4 hover:underline"
					>
						View all
					</Link>
				</div>

				<div className="mt-8 divide-y divide-border border-y border-border">
					{tools.map((tool) => (
						<Link
							key={tool.name}
							to={tool.href}
							className="flex items-center justify-between gap-4 py-4 group hover:bg-(--bg-secondary)/50 px-2 rounded-lg transition-colors"
						>
							<div className="flex items-start gap-3">
								<div className="mt-0.5 text-(--link)">{tool.icon}</div>
								<div>
									<h3 className="text-sm font-medium text-(--text) group-hover:text-(--link) transition-colors">
										{tool.name}
									</h3>
									<p className="mt-0.5 text-xs text-(--text-secondary)">
										{tool.text}
									</p>
								</div>
							</div>
							<span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
								{tool.status}
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

function ClosingCta() {
	return (
		<section className="border-t border-border bg-(--bg-secondary)">
			<div className="mx-auto max-w-2xl px-6 py-20 text-center">
				<h2 className="text-2xl font-semibold">Ready to run a check?</h2>
				<p className="mx-auto mt-3 max-w-md text-sm text-(--text-secondary)">
					The dashboard has every tool in one place, starting with the port
					scanner.
				</p>
				<div className="mt-6">
					<Button
						asChild
						className="hover:text-(--text)/80 text-(--text) bg-(--link) hover:bg-(--link)/80"
					>
						<Link to="/dashboard">
							Open dashboard
							<ArrowRight className="ml-1.5 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
