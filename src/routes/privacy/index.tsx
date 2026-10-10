import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Clock,
	Eye,
	FileText,
	Lock,
	Server,
	Shield,
	UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacy/")({
	component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
				{/* Top Navigation / Breadcrumb */}
				<div className="mb-8 flex items-center justify-between">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="gap-2 text-xs text-(--text-secondary) hover:text-(--text) hover:bg-(--bg-secondary)"
					>
						<Link to="/">
							<ArrowLeft className="h-3.5 w-3.5 text-(--link)" />
							Back to Recon Console
						</Link>
					</Button>

					<div className="flex items-center gap-2">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="text-xs border-border bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text) hover:bg-(--bg-secondary)/80"
						>
							<Link to="/terms">
								Terms of Service
								<ArrowRight className="ml-1.5 h-3.5 w-3.5 text-(--link)" />
							</Link>
						</Button>
					</div>
				</div>

				{/* Header Section */}
				<header className="mb-12 border-b border-border pb-8">
					<div className="mb-3 flex items-center gap-2 text-(--link)">
						<Shield className="h-5 w-5" />
						<span className="font-mono text-xs tracking-wider uppercase">
							Legal & Compliance
						</span>
					</div>
					<h1 className="text-3xl font-semibold tracking-tight text-(--text) sm:text-4xl">
						Privacy Policy
					</h1>
					<p className="mt-3 text-base text-(--text-secondary) max-w-2xl leading-relaxed">
						How Recon Console handles user queries, telemetry, and account data
						while operating passive security intelligence tools.
					</p>

					<div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-(--text-secondary)">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--bg-secondary) px-3 py-1">
							<Clock className="h-3 w-3 text-(--link)" />
							Last Updated: October 2026
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--bg-secondary) px-3 py-1">
							<FileText className="h-3 w-3 text-(--link)" />
							Version 1.0
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--bg-secondary) px-3 py-1 text-emerald-400 border-emerald-900/50">
							<CheckCircle2 className="h-3 w-3" />
							Passive Intel Only
						</span>
					</div>
				</header>

				{/* Executive Summary Cards */}
				<section className="mb-12">
					<h2 className="font-mono text-xs uppercase tracking-wider text-(--text-secondary) mb-4">
						Key Highlights at a Glance
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<Server className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Zero Active Port Scanning
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									Recon Console does not send raw packets or probe target hosts
									directly. All results are fetched from public pre-indexed
									registries like Shodan InternetDB, public WHOIS servers, and
									Certificate Transparency logs.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<Eye className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										No Data Monetization
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									We never sell, rent, or trade your personal data, lookup
									queries, or account credentials to third parties or
									advertising networks.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<Lock className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Encrypted in Transit
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									All communications between your browser and our servers are
									encrypted via standard TLS/HTTPS. Sessions and authentication
									tokens are securely managed.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<UserCheck className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Control & Deletion
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									You retain full control over your account. You can request
									complete deletion of your account record and associated search
									history at any time.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Detailed Policy Sections */}
				<div className="space-y-10">
					{/* Section 1 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>01</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Overview & Project Purpose</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							1. Overview & Scope
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								This Privacy Policy describes how Recon Console ("we", "our", or
								"the platform"), maintained as a defensive security research and
								portfolio showcase project, collects, handles, and protects
								information when you visit the website, utilize our host
								reconnaissance utilities, or create a registered user account.
							</p>
							<p>
								By accessing or using Recon Console, you acknowledge that you
								have read and understood this Privacy Policy. If you do not
								agree with our practices, please discontinue use of the
								platform.
							</p>
						</div>
					</section>

					{/* Section 2 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>02</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Data Collection</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							2. Information We Collect
						</h2>
						<div className="mt-4 space-y-4 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We prioritize data minimization, collecting only what is
								necessary to execute search queries, manage authentication, and
								safeguard our infrastructure:
							</p>

							<div className="rounded-lg border border-border/60 bg-(--bg) p-4 space-y-2">
								<h3 className="font-medium text-(--text) text-xs uppercase tracking-wide font-mono">
									A. Account Information (Authenticated Users)
								</h3>
								<p className="text-xs">
									When signing up or authenticating via Better Auth, we may
									collect:
								</p>
								<ul className="list-disc pl-5 text-xs space-y-1 text-(--text-secondary)">
									<li>Email address and display name</li>
									<li>
										Hashed authentication credentials or OAuth provider tokens
									</li>
									<li>
										Account creation timestamp and last active session dates
									</li>
								</ul>
							</div>

							<div className="rounded-lg border border-border/60 bg-(--bg) p-4 space-y-2">
								<h3 className="font-medium text-(--text) text-xs uppercase tracking-wide font-mono">
									B. Reconnaissance Query Inputs
								</h3>
								<p className="text-xs">
									When you interact with our lookup tools (e.g. IP scan, WHOIS
									query, or subdomain enumeration), you submit target
									identifiers such as:
								</p>
								<ul className="list-disc pl-5 text-xs space-y-1 text-(--text-secondary)">
									<li>IPv4 and IPv6 target addresses</li>
									<li>Fully qualified domain names (FQDNs)</li>
								</ul>
								<p className="text-xs text-(--text-secondary)/80">
									These query strings are processed by our backend to dispatch
									requests to external passive databases.
								</p>
							</div>

							<div className="rounded-lg border border-border/60 bg-(--bg) p-4 space-y-2">
								<h3 className="font-medium text-(--text) text-xs uppercase tracking-wide font-mono">
									C. Technical & Telemetry Logs
								</h3>
								<p className="text-xs">
									Like most web applications, our infrastructure automatically
									records standard HTTP request headers:
								</p>
								<ul className="list-disc pl-5 text-xs space-y-1 text-(--text-secondary)">
									<li>Client IP address and user-agent string</li>
									<li>
										Request timestamps, response status codes, and latency
									</li>
									<li>
										Rate-limiting buckets to protect backend APIs from
										exhaustion
									</li>
								</ul>
							</div>
						</div>
					</section>

					{/* Section 3 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>03</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Passive Lookups & Third Parties</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							3. Passive Intelligence & External APIs
						</h2>
						<div className="mt-4 space-y-4 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								Recon Console operates on a strict{" "}
								<span className="text-(--text) font-medium">
									passive reconnaissance
								</span>{" "}
								model. We do not perform active socket handshakes, port probes,
								or vulnerability scans directly from our hosting servers against
								target hosts.
							</p>
							<p>
								Instead, when you initiate a search, our server queries open,
								authoritative, and public third-party services:
							</p>

							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<div className="font-mono text-xs font-semibold text-(--link)">
										Shodan InternetDB
									</div>
									<p className="mt-1 text-xs text-(--text-secondary)">
										Aggregated historical open ports, hostnames, and public CVE
										tags for queried IP addresses.
									</p>
								</div>
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<div className="font-mono text-xs font-semibold text-(--link)">
										Public WHOIS Registries
									</div>
									<p className="mt-1 text-xs text-(--text-secondary)">
										ICANN and registrar directory records, including name
										servers and expiration dates.
									</p>
								</div>
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<div className="font-mono text-xs font-semibold text-(--link)">
										Certificate Transparency
									</div>
									<p className="mt-1 text-xs text-(--text-secondary)">
										Public cryptographic certificate logs for uncovering domain
										subdomains passively.
									</p>
								</div>
							</div>

							<p className="text-xs text-(--text-secondary)">
								Queries forwarded to third-party APIs are governed by each
								respective provider's privacy and data governance policies. We
								do not transmit your personal user profile or credentials to
								these external lookup services.
							</p>
						</div>
					</section>

					{/* Section 4 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>04</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Information Usage</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							4. How We Use Information
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We use the data we collect solely for legitimate platform
								operations:
							</p>
							<ul className="list-disc pl-5 space-y-2 text-sm text-(--text-secondary)">
								<li>
									<strong className="text-(--text)">Service Delivery:</strong>{" "}
									To parse, enrich, and render comprehensive reconnaissance
									reports on queried hosts.
								</li>
								<li>
									<strong className="text-(--text)">Security & Defense:</strong>{" "}
									To detect, prevent, and respond to denial-of-service attempts,
									credential stuffing, automated scraping, or platform abuse.
								</li>
								<li>
									<strong className="text-(--text)">Session State:</strong> To
									authenticate users, manage access privileges, and persist user
									preferences.
								</li>
								<li>
									<strong className="text-(--text)">
										Performance Optimization:
									</strong>{" "}
									To diagnose crashes, latency bottlenecks, and network
									anomalies across our hosting setup.
								</li>
							</ul>
						</div>
					</section>

					{/* Section 5 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>05</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Storage & Retention</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							5. Data Retention & Cookies
						</h2>
						<div className="mt-4 space-y-4 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We do not retain query results or telemetry logs longer than
								strictly needed for functional operation and troubleshooting:
							</p>

							<div className="space-y-3">
								<div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-2 text-xs">
									<span className="font-mono text-(--text)">Account Data</span>
									<span className="text-(--text-secondary)">
										Retained until account deletion is requested
									</span>
								</div>
								<div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-2 text-xs">
									<span className="font-mono text-(--text)">
										Access & HTTP Telemetry Logs
									</span>
									<span className="text-(--text-secondary)">
										Rotated and purged every 14 to 30 days
									</span>
								</div>
								<div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-2 text-xs">
									<span className="font-mono text-(--text)">
										Temporary Query Cache
									</span>
									<span className="text-(--text-secondary)">
										Cached ephemerally to prevent upstream rate limits
									</span>
								</div>
							</div>

							<div className="rounded-lg border border-border bg-(--bg) p-4 mt-4">
								<h3 className="font-medium text-(--text) text-xs mb-1">
									Cookies & Session Storage
								</h3>
								<p className="text-xs text-(--text-secondary)">
									We use essential session cookies strictly required for user
									authentication and CSRF protection. We do not use third-party
									analytics cookies, advertising trackers, or cross-site
									tracking pixels.
								</p>
							</div>
						</div>
					</section>

					{/* Section 6 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>06</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Security Safeguards</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							6. Data Security
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We implement technical and organizational controls to safeguard
								platform data against unauthorized access, loss, or disclosure:
							</p>
							<ul className="list-disc pl-5 text-sm space-y-1.5 text-(--text-secondary)">
								<li>
									Enforced HTTPS/TLS encryption across all public web and API
									endpoints.
								</li>
								<li>
									Authentication tokens and sensitive secrets encrypted at rest
									and in memory.
								</li>
								<li>
									Network-level isolation and firewall boundaries on our cloud
									infrastructure.
								</li>
								<li>
									Strict rate limiting on API endpoints to prevent brute-force
									attacks.
								</li>
							</ul>
							<p className="text-xs text-(--text-secondary)/80 italic">
								Please note that no digital transmission or cloud storage system
								is 100% immune to security incidents. We encourage users to
								maintain strong credentials.
							</p>
						</div>
					</section>

					{/* Section 7 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>07</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">User Rights</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							7. Your Rights & Data Choices
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								Depending on your jurisdiction, you may have statutory rights
								regarding your personal information:
							</p>
							<div className="grid gap-3 sm:grid-cols-2 text-xs">
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<strong className="text-(--text) block mb-1">
										Access & Portability
									</strong>
									You have the right to request a copy of the profile data
									associated with your account.
								</div>
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<strong className="text-(--text) block mb-1">
										Rectification
									</strong>
									You can update inaccurate email or profile details directly
									within your account settings.
								</div>
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<strong className="text-(--text) block mb-1">
										Deletion (Erasure)
									</strong>
									You may request permanent removal of your account and related
									metadata.
								</div>
								<div className="rounded-lg border border-border bg-(--bg) p-3">
									<strong className="text-(--text) block mb-1">
										Objection & Restriction
									</strong>
									You can opt out of non-essential processing at any time.
								</div>
							</div>
						</div>
					</section>

					{/* Section 8 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>08</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Contact & Changes</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							8. Changes to Policy & Contact
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We may revise this Privacy Policy periodically to reflect
								enhancements in our tooling, underlying dependencies, or
								statutory regulations. Any amendments will be posted here with
								an updated "Last Updated" timestamp.
							</p>
							<p>
								If you have questions, feedback, or data privacy requests
								concerning Recon Console, please open an issue or inquiry via
								our GitHub project repository.
							</p>
						</div>
					</section>
				</div>

				{/* Footer CTA & Navigation */}
				<div className="mt-12 rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
					<div>
						<h3 className="text-base font-semibold text-(--text)">
							Review our Terms of Service
						</h3>
						<p className="mt-1 text-xs text-(--text-secondary)">
							Read our rules on acceptable use, authorized scanning, and service
							limitations.
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							asChild
							className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80"
						>
							<Link to="/terms">
								Terms of Service
								<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
						<Button
							variant="outline"
							className="text-xs border-border bg-(--bg) text-(--text-secondary) hover:text-(--text)"
						>
							<Link to="/dashboard">Go to Dashboard</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
