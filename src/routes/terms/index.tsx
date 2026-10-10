import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Clock,
	FileText,
	Scale,
	ShieldAlert,
	ShieldCheck,
	Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/terms/")({
	component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
							className="text-xs border-border bg-(--link) text-white hover:text-white h-9 hover:bg-(--link)/80"
						>
							<Link to="/privacy" className="cursor-default">
								Privacy Policy
								<ArrowRight className="h-3.5 w-3.5 text-white" />
							</Link>
						</Button>
					</div>
				</div>

				{/* Header Section */}
				<header className="mb-12 border-b border-border pb-8">
					<div className="mb-3 flex items-center gap-2 text-(--link)">
						<Scale className="h-5 w-5" />
						<span className="font-mono text-xs tracking-wider uppercase">
							Legal & Compliance
						</span>
					</div>
					<h1 className="text-3xl font-semibold tracking-tight text-(--text) sm:text-4xl">
						Terms of Service
					</h1>
					<p className="mt-3 text-base text-(--text-secondary) max-w-2xl leading-relaxed">
						Rules, acceptable use policies, and liability limitations governing
						your access to Recon Console and its host reconnaissance utilities.
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
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--bg-secondary) px-3 py-1 text-amber-400 border-amber-900/50">
							<ShieldCheck className="h-3 w-3" />
							Defensive & Educational Use Only
						</span>
					</div>
				</header>

				{/* Executive Summary Cards */}
				<section className="mb-12">
					<h2 className="font-mono text-xs uppercase tracking-wider text-(--text-secondary) mb-4">
						Core Principles & Requirements
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<ShieldCheck className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Authorized Research Only
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									You agree to use these tools solely for authorized security
									audits, defensive posture evaluation of assets you own or have
									explicit permission to inspect, or educational study.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-rose-400">
									<ShieldAlert className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Zero Tolerance for Abuse
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									You may not use Recon Console to conduct denial-of-service
									(DoS) attacks, cyber espionage, unlawful stalking, automated
									credential stuffing, or exploitation of identified
									vulnerabilities.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<Terminal className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Passive Third-Party Data
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									Data is queried passively from external public directories
									(Shodan, WHOIS, Certificate Transparency). We do not guarantee
									real-time accuracy, exhaustiveness, or uptime.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-(--bg-secondary) border-border">
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2 text-(--link)">
									<AlertTriangle className="h-4 w-4" />
									<CardTitle className="text-sm font-medium text-(--text)">
										Provided "As Is"
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-xs leading-relaxed text-(--text-secondary)">
									As a portfolio showcase and experimental security toolkit, the
									platform is provided without warranties of fitness or
									uninterrupted operation. Use is at your own risk.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Detailed Terms Sections */}
				<div className="space-y-10">
					{/* Section 1 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>01</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Agreement</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							1. Acceptance of Terms
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								By accessing, browsing, or utilizing the services provided by
								Recon Console ("Platform", "we", "us"), you agree to be legally
								bound by these Terms of Service ("Terms") and our Privacy
								Policy.
							</p>
							<p>
								If you do not agree to every provision contained within these
								Terms, you must immediately terminate use of the platform.
								Continued usage represents your unconditional acceptance.
							</p>
						</div>
					</section>

					{/* Section 2 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>02</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Scope & Educational Nature</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							2. Project Purpose & Scope
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								Recon Console is developed as an educational project showcase
								and defensive reconnaissance dashboard. The tools are designed
								to demonstrate OSINT aggregation workflows, modern full-stack
								web architectures (TanStack Start, Vite, Tailwind CSS), and
								secure cloud deployment.
							</p>
							<p>
								The platform is intended for security engineers, system
								administrators, software developers, and technology enthusiasts
								seeking to review public footprints of Internet-facing assets.
							</p>
						</div>
					</section>

					{/* Section 3 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>03</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Permitted & Acceptable Use</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							3. Permitted Use Policy
						</h2>
						<div className="mt-4 space-y-4 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								You are granted a limited, revocable, non-exclusive license to
								access the platform and query host records, subject to the
								following conditions:
							</p>

							<div className="space-y-3">
								<div className="rounded-lg border border-border/60 bg-(--bg) p-4">
									<h3 className="font-medium text-(--text) text-xs uppercase tracking-wide font-mono">
										A. Defensive & Authorized Assessment
									</h3>
									<p className="mt-1 text-xs">
										You may query systems you own, manage, or have received
										express written authorization to analyze, or for general
										non-adversarial research into public data.
									</p>
								</div>

								<div className="rounded-lg border border-border/60 bg-(--bg) p-4">
									<h3 className="font-medium text-(--text) text-xs uppercase tracking-wide font-mono">
										B. Passive Intelligence Queries
									</h3>
									<p className="mt-1 text-xs">
										Our tools retrieve indexed information from public
										repositories. You agree not to use our querying interface as
										an intermediary to overwhelm third-party APIs.
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* Section 4 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-rose-400">
							<span>04</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Prohibitions</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							4. Strictly Prohibited Conduct
						</h2>
						<div className="mt-4 space-y-4 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								You may <strong className="text-rose-400">NOT</strong> under any
								circumstances use Recon Console for any of the following:
							</p>

							<ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-(--text-secondary)">
								<li>
									<strong className="text-(--text)">
										Malicious Exploitation:
									</strong>{" "}
									Using revealed open ports, versions, or CVE flags to perform
									unauthorized penetration, exploitation, or data exfiltration
									on target hosts.
								</li>
								<li>
									<strong className="text-(--text)">
										Denial of Service (DoS):
									</strong>{" "}
									Flooding, spamming, or intentionally submitting
									high-concurrency requests designed to exhaust server resources
									or upstream rate limits.
								</li>
								<li>
									<strong className="text-(--text)">Automated Scraping:</strong>{" "}
									Deploying unauthorized bots, spiders, or headless scrapers to
									harvest bulk database records without explicit authorization.
								</li>
								<li>
									<strong className="text-(--text)">Bypassing Controls:</strong>{" "}
									Circumventing authentication barriers, manipulating
									rate-limiting headers, or tampering with internal application
									endpoints.
								</li>
								<li>
									<strong className="text-(--text)">
										Harassment & Unlawful Acts:
									</strong>{" "}
									Facilitating stalking, cyber harassment, doxxing, or any
									activity violating local, state, or international cybercrime
									laws (e.g. Computer Fraud and Abuse Act).
								</li>
							</ul>

							<div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-4 text-xs text-rose-300">
								Violation of these restrictions will result in immediate IP
								banning, account termination, and, where appropriate, referral
								to competent legal authorities.
							</div>
						</div>
					</section>

					{/* Section 5 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>05</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Intelligence Disclaimer</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							5. Third-Party Data & Disclaimers
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								The information generated by our tools (such as Shodan
								InternetDB open port inventories, WHOIS registrar details, and
								subdomain lists) originates from external, independently
								maintained datasets:
							</p>
							<ul className="list-disc pl-5 space-y-1.5 text-xs text-(--text-secondary)">
								<li>
									<strong className="text-(--text)">Point-in-Time Data:</strong>{" "}
									Port listings and vulnerability matches reflect the historical
									scan cache of third-party indexes, not guaranteed live target
									states.
								</li>
								<li>
									<strong className="text-(--text)">
										False Positives & Negatives:
									</strong>{" "}
									A host may have modified its firewall rules, patched CVEs, or
									changed IP allocations since the external dataset was updated.
								</li>
								<li>
									<strong className="text-(--text)">No Endorsement:</strong> We
									do not verify, endorse, or take responsibility for the
									contents of third-party datasets or external websites linked
									within queries.
								</li>
							</ul>
						</div>
					</section>

					{/* Section 6 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>06</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Account Security</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							6. User Accounts & Responsibilities
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>When creating an account on Recon Console, you agree to:</p>
							<ul className="list-disc pl-5 space-y-1.5 text-xs text-(--text-secondary)">
								<li>Provide truthful and accurate authentication details.</li>
								<li>
									Safeguard your authentication credentials and session tokens
									from unauthorized access.
								</li>
								<li>
									Immediately notify us if you suspect any compromise of your
									account credentials.
								</li>
							</ul>
							<p className="text-xs text-(--text-secondary)">
								We reserve the right to suspend or terminate accounts that
								exhibit abusive behavior, excessive error rates, or violation of
								these terms.
							</p>
						</div>
					</section>

					{/* Section 7 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>07</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Legal Disclaimers</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							7. Warranties & Limitation of Liability
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<div className="rounded-lg border border-border bg-(--bg) p-4 font-mono text-xs leading-normal">
								<p className="uppercase text-(--text) font-semibold mb-2">
									Disclaimer of Warranties ("AS IS")
								</p>
								<p className="text-(--text-secondary)">
									RECON CONSOLE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE"
									BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
									IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
									MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
									NON-INFRINGEMENT, OR UNINTERRUPTED OPERATION.
								</p>
							</div>

							<div className="rounded-lg border border-border bg-(--bg) p-4 font-mono text-xs leading-normal">
								<p className="uppercase text-(--text) font-semibold mb-2">
									Limitation of Liability
								</p>
								<p className="text-(--text-secondary)">
									TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THE
									CREATORS, DEVELOPERS, OR OPERATORS OF RECON CONSOLE BE LIABLE
									FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
									OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, SYSTEM OUTAGES,
									BUSINESS DISRUPTION, OR LEGAL DISPUTES ARISING FROM YOUR USE
									OR INABILITY TO USE THE TOOLS.
								</p>
							</div>
						</div>
					</section>

					{/* Section 8 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>08</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Modifications & Termination</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							8. Modifications to Service & Terms
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								We reserve the continuous right to modify, adjust, deprecate, or
								suspend any tool, feature, or route on Recon Console at any time
								without prior notice.
							</p>
							<p>
								We may also update these Terms of Service periodically. Your
								continued use of the platform following the posting of amended
								terms signifies your acceptance of the revised conditions.
							</p>
						</div>
					</section>

					{/* Section 9 */}
					<section className="rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8">
						<div className="flex items-center gap-2 font-mono text-xs text-(--link)">
							<span>09</span>
							<span className="opacity-50">|</span>
							<span className="uppercase">Contact</span>
						</div>
						<h2 className="mt-2 text-xl font-semibold text-(--text)">
							9. Contact & Inquiries
						</h2>
						<div className="mt-4 space-y-3 text-sm text-(--text-secondary) leading-relaxed">
							<p>
								If you have questions regarding these Terms of Service or need
								to report a technical issue or vulnerability, please reach out
								via our GitHub repository issue tracker.
							</p>
						</div>
					</section>
				</div>

				{/* Footer CTA & Navigation */}
				<div className="mt-12 rounded-xl border border-border bg-(--bg-secondary) p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
					<div>
						<h3 className="text-base font-semibold text-(--text)">
							Questions about your data?
						</h3>
						<p className="mt-1 text-xs text-(--text-secondary)">
							Review our Privacy Policy to understand how we store and handle
							query information.
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							asChild
							className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80"
						>
							<Link to="/privacy" className="cursor-default">
								Privacy Policy
								<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
