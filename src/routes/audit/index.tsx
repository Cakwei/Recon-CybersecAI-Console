import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertTriangle,
	ArrowLeft,
	ExternalLink,
	Globe,
	Lock,
	Network,
	Search,
	Server,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { CyberChat } from "#/components/chat/cyber-chat.tsx";
import type { AiProvider } from "#/lib/ai-analyst.ts";
import {
	auditInputSchema,
	performUnifiedAuditServerFn,
	type SecurityRisk,
	type UnifiedAuditResult,
} from "#/lib/audit.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/audit/")({
	component: UnifiedAuditPage,
});

function UnifiedAuditPage() {
	const [result, setResult] = useState<UnifiedAuditResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const [selectedProvider, setSelectedProvider] = useState<AiProvider>("auto");

	const runAudit = useServerFn(performUnifiedAuditServerFn);

	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 4,
			windowMs: 15000,
			name: "Unified audit",
		});

	const auditForm = useForm({
		defaultValues: { target: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			setResult(null);
			setLoading(true);

			try {
				const data = await runAudit({ data: { target: value.target.trim() } });
				setResult(data);
			} catch (err: unknown) {
				setError(
					err instanceof Error
						? err.message
						: "Unified audit execution failed.",
				);
			} finally {
				setLoading(false);
			}
		},
	});

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		executeWithRateLimit(() => {
			auditForm.handleSubmit();
		});
	};

	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
				{/* Top Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ml-2 text-(--text-secondary) hover:text-(--text) hover:bg-(--bg-secondary)"
					>
						<Link to="/dashboard">
							<ArrowLeft className="mr-1.5 h-4 w-4" />
							Dashboard
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className="border-(--link)/40 text-(--link) font-mono text-[10px] tracking-wider uppercase"
						>
							New
						</Badge>
						<Badge
							variant="outline"
							className="border-purple-500/40 text-purple-400 font-mono text-[10px] tracking-wider uppercase"
						>
							AI-Assisted
						</Badge>
					</div>
				</div>

				{/* Header */}
				<header className="mb-8">
					<p className="font-mono text-xs tracking-wider text-(--text-secondary) uppercase">
						One-Click Target Dossier & AI Analyst
					</p>
					<h1 className="mt-1 text-2xl font-semibold sm:text-3xl tracking-tight text-(--text)">
						Unified Attack Surface Audit
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary) max-w-2xl leading-relaxed">
						Aggregate SSL certificates, DNS hygiene (SPF, DMARC), active
						subdomains, and host vulnerabilities (Shodan CVEs & open ports) into
						a single dossier, evaluated with an AI Security Analyst.
					</p>
				</header>

				{/* Search Form */}
				<form onSubmit={handleSubmit} className="space-y-3 mb-10">
					<Label htmlFor="target" className="text-xs text-(--text-secondary)">
						Target Domain or Public IPv4
					</Label>
					<div className="flex gap-2.5">
						<auditForm.Field
							name="target"
							validators={{
								onChange: ({ value }) => {
									const trimmed = value.trim();
									if (!trimmed) {
										return "Target is required";
									}
									const parse = auditInputSchema.safeParse({ target: trimmed });
									if (!parse.success) {
										return (
											parse.error.issues[0]?.message || "Invalid target format"
										);
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />
									<Input
										id={field.name}
										name={field.name}
										placeholder="e.g. example.com or 1.1.1.1"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										autoComplete="off"
										spellCheck={false}
										className="border-border bg-(--bg-secondary) pl-9 font-mono text-xs text-(--text) placeholder:text-(--text-secondary)/60 focus-visible:ring-(--link)"
									/>
								</div>
							)}
						</auditForm.Field>

						<auditForm.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
								state.values.target,
								state.errors,
							]}
						>
							{([canSubmit, isSubmitting, targetVal, errors]) => {
								const isValid =
									typeof targetVal === "string" &&
									targetVal.trim().length > 0 &&
									auditInputSchema.safeParse({ target: targetVal }).success &&
									Array.isArray(errors) &&
									errors.length === 0;

								return (
									<Button
										type="submit"
										disabled={Boolean(
											!canSubmit ||
												isSubmitting ||
												loading ||
												!isValid ||
												isExceeded,
										)}
										className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80 shrink-0 font-medium"
									>
										{isSubmitting || loading ? (
											<>Auditing…</>
										) : isExceeded ? (
											"Rate limited"
										) : (
											<>Run Full Audit</>
										)}
									</Button>
								);
							}}
						</auditForm.Subscribe>
					</div>

					{rateLimitError && (
						<Alert className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-2">
							<AlertDescription>{rateLimitError}</AlertDescription>
						</Alert>
					)}

					<div className="w-full">
						<auditForm.Field name="target">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs text-red-500 mt-1 block">
										{field.state.meta.errors[0]}
									</Label>
								)
							}
						</auditForm.Field>
					</div>
				</form>

				{/* Error State */}
				{error && (
					<Alert className="mb-8 border-red-500/40 bg-red-500/10 text-red-400">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle className="text-sm font-semibold">
							Audit Error
						</AlertTitle>
						<AlertDescription className="text-xs mt-1">
							{error}
						</AlertDescription>
					</Alert>
				)}

				{/* Loading Skeleton */}
				{loading && <AuditLoadingSkeleton />}

				{/* Results */}
				{result && (
					<div className="space-y-8 animate-in fade-in duration-300">
						{/* Scorecard Hero */}
						<ScorecardHero
							scorecard={result.scorecard}
							target={result.cleanedTarget}
							resolvedIps={result.resolvedIps}
							scanTimestamp={result.scanTimestamp}
						/>

						{/* AI Analyst Conversational Chat with Markdown & Streaming */}
						<CyberChat
							target={result.cleanedTarget}
							dossierContext={{
								grade: result.scorecard.grade,
								score: result.scorecard.score,
								summary: result.scorecard.summary,
								risks: result.scorecard.risks,
								openPorts: result.host?.ports ?? [],
								cves: result.host?.vulns ?? [],
								subdomainsCount: result.subdomains?.subdomains?.length ?? 0,
							}}
							selectedProvider={selectedProvider}
							onSelectProvider={setSelectedProvider}
						/>

						{/* Detailed Findings & Reconnaissance Cards */}
						<div className="grid gap-6 md:grid-cols-2">
							{/* Risks Breakdown */}
							<RisksCard risks={result.scorecard.risks} />

							{/* Host & Open Ports (Shodan) */}
							<HostSecurityCard
								host={result.host}
								error={result.errors.host}
								resolvedIps={result.resolvedIps}
							/>

							{/* SSL/TLS Health */}
							<SslSummaryCard
								ssl={result.ssl}
								error={result.errors.ssl}
								daysLeft={result.scorecard.metrics.sslDaysLeft}
							/>

							{/* DNS & Anti-Spoofing Records */}
							<DnsHygieneCard dns={result.dns} error={result.errors.dns} />
						</div>

						{/* Subdomains Grid */}
						{result.subdomains && (
							<SubdomainsCard
								subdomainsResult={result.subdomains}
								error={result.errors.subdomains}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function ScorecardHero({
	scorecard,
	target,
	resolvedIps,
	scanTimestamp,
}: {
	scorecard: UnifiedAuditResult["scorecard"];
	target: string;
	resolvedIps: string[];
	scanTimestamp: string;
}) {
	const gradeColors = {
		A: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
		B: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
		C: "border-amber-500/50 bg-amber-500/10 text-amber-400",
		D: "border-orange-500/50 bg-orange-500/10 text-orange-400",
		F: "border-rose-500/50 bg-rose-500/10 text-rose-400",
	};

	return (
		<Card className="border-border bg-(--bg-secondary) overflow-hidden relative">
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-(--link) via-purple-500 to-emerald-400" />
			<CardContent className="p-6 sm:p-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-border">
					<div>
						<div className="flex items-center gap-2">
							<span className="font-mono text-xs text-(--text-secondary)">
								Target:
							</span>
							<span className="font-mono text-sm font-semibold text-(--text)">
								{target}
							</span>
							{resolvedIps.length > 0 && (
								<Badge
									variant="secondary"
									className="text-[10px] font-mono text-(--text-secondary) bg-transparent"
								>
									({resolvedIps[0]})
								</Badge>
							)}
							<span className="text-[10px] font-mono text-(--text-secondary) ml-2">
								{new Date(scanTimestamp).toLocaleTimeString()}
							</span>
						</div>
						<h2 className="mt-1 text-lg font-semibold text-(--text)">
							Security Exposure Scorecard
						</h2>
						<p className="mt-1 text-xs text-(--text-secondary) max-w-xl">
							{scorecard.summary}
						</p>
					</div>

					<div className="flex items-center gap-4 shrink-0">
						<div className="text-right">
							<div className="text-2xl font-bold font-mono text-(--text)">
								{scorecard.score}
								<span className="text-xs text-(--text-secondary) font-normal">
									/100
								</span>
							</div>
							<div className="text-[10px] text-(--text-secondary) uppercase tracking-wider">
								Overall Rating
							</div>
						</div>
						<div
							className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 font-mono text-3xl font-black ${
								gradeColors[scorecard.grade]
							}`}
						>
							{scorecard.grade}
						</div>
					</div>
				</div>

				{/* Quick Metrics Bar */}
				<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
					<div className="rounded-lg border border-border bg-(--bg)/60 p-3">
						<div className="text-[10px] font-mono uppercase text-(--text-secondary)">
							Critical Risks
						</div>
						<div
							className={`mt-1 text-lg font-bold font-mono ${
								scorecard.metrics.criticalCount > 0
									? "text-rose-400"
									: "text-(--text)"
							}`}
						>
							{scorecard.metrics.criticalCount}
						</div>
					</div>

					<div className="rounded-lg border border-border bg-(--bg)/60 p-3">
						<div className="text-[10px] font-mono uppercase text-(--text-secondary)">
							Open Ports
						</div>
						<div
							className={`mt-1 text-lg font-bold font-mono ${
								scorecard.metrics.openPortsCount > 3
									? "text-amber-400"
									: "text-(--text)"
							}`}
						>
							{scorecard.metrics.openPortsCount}
						</div>
					</div>

					<div className="rounded-lg border border-border bg-(--bg)/60 p-3">
						<div className="text-[10px] font-mono uppercase text-(--text-secondary)">
							Known CVEs
						</div>
						<div
							className={`mt-1 text-lg font-bold font-mono ${
								scorecard.metrics.cvesCount > 0
									? "text-rose-400"
									: "text-(--text)"
							}`}
						>
							{scorecard.metrics.cvesCount}
						</div>
					</div>

					<div className="rounded-lg border border-border bg-(--bg)/60 p-3">
						<div className="text-[10px] font-mono uppercase text-(--text-secondary)">
							Subdomains
						</div>
						<div className="mt-1 text-lg font-bold font-mono text-(--text)">
							{scorecard.metrics.subdomainsCount}
						</div>
					</div>

					<div className="rounded-lg border border-border bg-(--bg)/60 p-3 col-span-2 sm:col-span-1">
						<div className="text-[10px] font-mono uppercase text-(--text-secondary)">
							SSL Validity
						</div>
						<div className="mt-1 text-sm font-semibold font-mono text-(--text)">
							{scorecard.metrics.sslDaysLeft !== null
								? `${scorecard.metrics.sslDaysLeft}d left`
								: "N/A"}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function RisksCard({ risks }: { risks: SecurityRisk[] }) {
	const severityColor = {
		critical: "border-red-500/40 bg-red-500/10 text-red-400",
		high: "border-amber-500/40 bg-amber-500/10 text-amber-400",
		medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
		low: "border-blue-500/40 bg-blue-500/10 text-blue-300",
		info: "border-border bg-neutral-800 text-neutral-300",
	};

	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader className="p-5 pb-3">
				<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2">
					<ShieldAlert className="h-4 w-4 text-(--link)" />
					Identified Risks & Exposures
					<Badge
						variant="outline"
						className="text-[10px] text-(--text-secondary) font-mono ml-auto"
					>
						{risks.length} findings
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-3">
				{risks.length === 0 ? (
					<div className="py-6 text-center text-xs text-(--text-secondary)">
						<ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
						No high or critical risks detected on the audited perimeter.
					</div>
				) : (
					risks.map((risk) => (
						<div
							key={risk.id}
							className="rounded-lg border border-border bg-(--bg)/50 p-3"
						>
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className={`text-[9px] uppercase font-mono px-1.5 py-0.5 ${severityColor[risk.severity]}`}
								>
									{risk.severity}
								</Badge>
								<span className="font-medium text-xs text-(--text)">
									{risk.title}
								</span>
							</div>
							<p className="mt-1 text-[11px] text-(--text-secondary) leading-relaxed">
								{risk.description}
							</p>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

function HostSecurityCard({
	host,
	error,
	resolvedIps,
}: {
	host: UnifiedAuditResult["host"];
	error?: string;
	resolvedIps: string[];
}) {
	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader className="p-5 pb-3">
				<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2">
					<Server className="h-4 w-4 text-(--link)" />
					Host Security (Shodan InternetDB)
					{resolvedIps.length > 0 && (
						<span className="text-[10px] font-mono text-(--text-secondary) font-normal ml-auto">
							{resolvedIps[0]}
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-4">
				{error ? (
					<div className="text-xs text-(--text-secondary) py-4">{error}</div>
				) : !host ? (
					<div className="text-xs text-(--text-secondary) py-4">
						No public Shodan InternetDB record indexed for this host IP.
					</div>
				) : (
					<>
						<div>
							<div className="text-[11px] font-mono uppercase text-(--text-secondary) mb-1.5">
								Open Ports ({host.ports?.length ?? 0})
							</div>
							<div className="flex flex-wrap gap-1.5">
								{host.ports && host.ports.length > 0 ? (
									host.ports.map((port) => (
										<Badge
											key={port}
											variant="outline"
											className="border-border bg-(--bg) font-mono text-xs text-(--text)"
										>
											{port}
										</Badge>
									))
								) : (
									<span className="text-xs text-(--text-secondary)">
										None cataloged
									</span>
								)}
							</div>
						</div>

						{host.vulns && host.vulns.length > 0 && (
							<div>
								<div className="text-[11px] font-mono uppercase text-red-400 mb-1.5 flex items-center gap-1.5">
									<AlertTriangle className="h-3 w-3" />
									Cataloged CVEs ({host.vulns.length})
								</div>
								<div className="flex flex-wrap gap-1.5">
									{host.vulns.map((cve) => (
										<a
											key={cve}
											href={`https://nvd.nist.gov/vuln/detail/${cve}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
										>
											{cve}
											<ExternalLink className="h-2.5 w-2.5" />
										</a>
									))}
								</div>
							</div>
						)}

						{host.tags && host.tags.length > 0 && (
							<div>
								<div className="text-[11px] font-mono uppercase text-(--text-secondary) mb-1.5">
									Tags
								</div>
								<div className="flex flex-wrap gap-1.5">
									{host.tags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="text-[10px] font-mono border-(--link) bg-transparent text-(--link)"
										>
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function SslSummaryCard({
	ssl,
	error,
	daysLeft,
}: {
	ssl: UnifiedAuditResult["ssl"];
	error?: string;
	daysLeft: number | null;
}) {
	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader className="p-5 pb-3">
				<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2">
					<Lock className="h-4 w-4 text-(--link)" />
					SSL/TLS Certificate
					{ssl && (
						<Badge
							variant="outline"
							className={`text-[10px] font-mono ml-auto ${
								ssl.valid
									? "border-emerald-500/40 text-emerald-400"
									: "border-red-500/40 text-red-400"
							}`}
						>
							{ssl.valid ? "Valid" : "Invalid"}
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-3">
				{error ? (
					<div className="text-xs text-(--text-secondary) py-4">{error}</div>
				) : !ssl ? (
					<div className="text-xs text-(--text-secondary) py-4">
						No SSL certificate data returned.
					</div>
				) : (
					<div className="space-y-2 text-xs">
						<div className="flex justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">Issuer:</span>
							<span className="font-mono text-(--text)">
								{ssl.issuer?.CN || ssl.issuer?.O || "Unknown"}
							</span>
						</div>
						<div className="flex justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">Expires in:</span>
							<span
								className={`font-mono font-medium ${
									daysLeft !== null && daysLeft <= 14
										? "text-amber-400"
										: "text-(--text)"
								}`}
							>
								{daysLeft !== null ? `${daysLeft} days` : "Unknown"}
							</span>
						</div>
						<div className="flex justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">Cipher Key Bits:</span>
							<span className="font-mono text-(--text)">
								{ssl.details?.bits ? `${ssl.details.bits}-bit RSA` : "N/A"}
							</span>
						</div>
						<div className="pt-1">
							<Link
								to="/ssl"
								className="text-[11px] text-(--link) hover:underline inline-flex items-center gap-1"
							>
								Open dedicated SSL/TLS inspector
								<ExternalLink className="h-2.5 w-2.5" />
							</Link>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function DnsHygieneCard({
	dns,
	error,
}: {
	dns: UnifiedAuditResult["dns"];
	error?: string;
}) {
	const hasSpf = dns?.TXT?.some((t) => t.toLowerCase().startsWith("v=spf1"));
	const hasDmarc = (dns?.DMARC?.length ?? 0) > 0;

	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader className="p-5 pb-3">
				<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2">
					<Globe className="h-4 w-4 text-(--link)" />
					DNS Hygiene & Anti-Spoofing
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-3">
				{error ? (
					<div className="text-xs text-(--text-secondary) py-4">{error}</div>
				) : !dns ? (
					<div className="text-xs text-(--text-secondary) py-4">
						No DNS reconnaissance data returned.
					</div>
				) : (
					<div className="space-y-2 text-xs">
						<div className="flex items-center justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">SPF Record:</span>
							<Badge
								variant="outline"
								className={`text-[10px] font-mono ${
									hasSpf
										? "border-emerald-500/40 text-emerald-400"
										: "border-amber-500/40 text-amber-400"
								}`}
							>
								{hasSpf ? "Configured" : "Missing"}
							</Badge>
						</div>

						<div className="flex items-center justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">DMARC Policy:</span>
							<Badge
								variant="outline"
								className={`text-[10px] font-mono ${
									hasDmarc
										? "border-emerald-500/40 text-emerald-400"
										: "border-amber-500/40 text-amber-400"
								}`}
							>
								{hasDmarc ? "Configured" : "Missing"}
							</Badge>
						</div>

						<div className="flex items-center justify-between py-1 border-b border-border/50">
							<span className="text-(--text-secondary)">
								Mail (MX) Servers:
							</span>
							<span className="font-mono text-(--text)">
								{dns.MX?.length ?? 0} servers
							</span>
						</div>

						<div className="pt-1">
							<Link
								to="/dns"
								className="text-[11px] text-(--link) hover:underline inline-flex items-center gap-1"
							>
								Explore all DNS records
								<ExternalLink className="h-2.5 w-2.5" />
							</Link>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function SubdomainsCard({
	subdomainsResult,
	error,
}: {
	subdomainsResult: UnifiedAuditResult["subdomains"];
	error?: string;
}) {
	const subdomains = subdomainsResult?.subdomains ?? [];

	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader className="p-5 pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2">
						<Network className="h-4 w-4 text-(--link)" />
						Active Subdomains Discovered ({subdomains.length})
					</CardTitle>
					<Link
						to="/subdomains"
						className="text-[11px] text-(--link) hover:underline inline-flex items-center gap-1"
					>
						Full enumeration
						<ExternalLink className="h-2.5 w-2.5" />
					</Link>
				</div>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{error ? (
					<div className="text-xs text-(--text-secondary) py-4">{error}</div>
				) : subdomains.length === 0 ? (
					<div className="text-xs text-(--text-secondary) py-4">
						No active subdomains discovered.
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pt-1 pr-1 font-mono text-xs">
						{subdomains.map((sub) => (
							<div
								key={sub.subdomain}
								className="rounded border border-border/70 bg-(--bg)/60 p-2 truncate flex items-center justify-between"
							>
								<span className="truncate text-(--text)" title={sub.subdomain}>
									{sub.subdomain}
								</span>
								<Badge
									variant="secondary"
									className="text-[9px] font-mono shrink-0 ml-1"
								>
									{sub.type}
								</Badge>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AuditLoadingSkeleton() {
	return (
		<div className="space-y-6">
			<Card className="border-border bg-(--bg-secondary) p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-16 w-16 rounded-xl bg-neutral-800" />
					<div className="space-y-2 flex-1">
						<Skeleton className="h-5 w-1/3 bg-neutral-800" />
						<Skeleton className="h-4 w-2/3 bg-neutral-800" />
					</div>
				</div>
				<div className="grid grid-cols-4 gap-3 mt-6">
					<Skeleton className="h-16 rounded-lg bg-neutral-800" />
					<Skeleton className="h-16 rounded-lg bg-neutral-800" />
					<Skeleton className="h-16 rounded-lg bg-neutral-800" />
					<Skeleton className="h-16 rounded-lg bg-neutral-800" />
				</div>
			</Card>
			<Skeleton className="h-28 w-full rounded-xl bg-neutral-800" />
			<div className="grid grid-cols-2 gap-4">
				<Skeleton className="h-48 rounded-xl bg-neutral-800" />
				<Skeleton className="h-48 rounded-xl bg-neutral-800" />
			</div>
		</div>
	);
}
