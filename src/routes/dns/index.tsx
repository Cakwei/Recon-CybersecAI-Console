import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Clock,
	Copy,
	Database,
	Globe,
	Mail,
	Radar,
	Search,
	Server,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { domainSchema } from "#/lib/schema.ts";
import type { DnsReconResult } from "#/lib/types.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { reconDnsServerFn } from "#/lib/whoisjson.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dns/")({
	component: DnsReconPage,
});

function DnsReconPage() {
	const [result, setResult] = useState<DnsReconResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedText, setCopiedText] = useState<string | null>(null);

	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 5,
			windowMs: 10000,
			name: "DNS reconnaissance",
		});

	const dnsReconForm = useForm({
		defaultValues: { domainName: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			setResult(null);
			setLoading(true);

			try {
				const data = await reconDnsServerFn({
					data: { domain: value.domainName },
				});
				setResult(data);
			} catch (err: unknown) {
				setError(
					err instanceof Error ? err.message : "DNS reconnaissance failed.",
				);
			} finally {
				setLoading(false);
			}
		},
	});

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		executeWithRateLimit(() => {
			dnsReconForm.handleSubmit();
		});
	};

	function handleCopy(text: string) {
		navigator.clipboard.writeText(text);
		setCopiedText(text);
		setTimeout(() => setCopiedText(null), 2000);
	}

	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
				{/* Top Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="gap-2 text-xs text-(--text-secondary) hover:text-(--text) hover:bg-(--bg-secondary)"
					>
						<Link to="/dashboard">
							<ArrowLeft className="h-3.5 w-3.5 text-(--link)" />
							Back to Dashboard
						</Link>
					</Button>

					<div className="flex items-center gap-2">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="text-xs border-border bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text)"
						>
							<Link to="/ssl">SSL Audit</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							size="sm"
							className="text-xs border-border bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text)"
						>
							<Link to="/subdomains">Subdomains</Link>
						</Button>
					</div>
				</div>

				{/* Page Header */}
				<header className="mb-10">
					<div className="mb-2 flex items-center gap-2 text-(--link)">
						<Globe className="h-5 w-5" />
						<span className="font-mono text-xs tracking-wide uppercase">
							DNS Intelligence
						</span>
					</div>
					<h1 className="text-2xl font-semibold sm:text-3xl text-(--text)">
						DNS Reconnaissance
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary) max-w-xl">
						Resolve authoritative DNS records across A, AAAA, MX, NS, TXT, SOA,
						and email security policies (DMARC, CAA) via WhoisJSON.
					</p>
				</header>

				{/* Search Form */}
				<form onSubmit={handleSearch} className="space-y-3">
					<Label
						htmlFor="domainName"
						className="text-xs text-(--text-secondary)"
					>
						Target Domain
					</Label>
					<div className="flex gap-2.5">
						<dnsReconForm.Field
							name="domainName"
							validators={{
								onChange: ({ value }) => {
									const trimmed = value.trim();
									if (!trimmed) {
										return "Domain name is required";
									}
									const parseResult = domainSchema.safeParse(trimmed);
									if (!parseResult.success) {
										return (
											parseResult.error.issues[0]?.message ||
											"Invalid domain name"
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
										placeholder="Enter domain (e.g., example.com)"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										autoComplete="off"
										spellCheck={false}
										className="border-border bg-(--bg-secondary) pl-9 font-mono text-xs text-(--text) placeholder:text-(--text-secondary)/60 focus-visible:ring-(--link)"
									/>
								</div>
							)}
						</dnsReconForm.Field>

						<dnsReconForm.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
								state.values.domainName,
								state.errors,
							]}
						>
							{([canSubmit, isSubmitting, domainName, errors]) => {
								const isValid =
									typeof domainName === "string" &&
									domainName.trim().length > 0 &&
									domainSchema.safeParse(domainName).success &&
									errors.length === 0;

								return (
									<Button
										type="submit"
										disabled={
											!canSubmit ||
											isSubmitting ||
											loading ||
											!isValid ||
											isExceeded
										}
										className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80 shrink-0"
									>
										{isSubmitting || loading
											? "Resolving…"
											: isExceeded
												? "Rate limited"
												: "Recon DNS"}
									</Button>
								);
							}}
						</dnsReconForm.Subscribe>
					</div>

					{rateLimitError && (
						<Alert className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-2">
							<AlertDescription>{rateLimitError}</AlertDescription>
						</Alert>
					)}

					<div className="w-full">
						<dnsReconForm.Field name="domainName">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs mt-1.5 text-red-500">
										{field.state.meta.errors}
									</Label>
								)
							}
						</dnsReconForm.Field>
					</div>

					<p className="text-[11px] text-(--text-secondary)/80">
						Direct query to authoritative nameservers with recursive resolution.
					</p>
				</form>

				{/* Loading Skeleton */}
				{loading && (
					<div className="mt-10 space-y-4">
						<div className="grid gap-4 sm:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<Card key={i} className="border-border bg-(--bg-secondary) p-4">
									<Skeleton className="h-4 w-20 bg-border mb-2" />
									<Skeleton className="h-6 w-32 bg-border" />
								</Card>
							))}
						</div>
						<Card className="border-border bg-(--bg-secondary) p-6">
							<Skeleton className="h-6 w-48 bg-border mb-4" />
							<Skeleton className="h-4 w-full bg-border mb-2" />
							<Skeleton className="h-4 w-3/4 bg-border" />
						</Card>
					</div>
				)}

				{/* Error Alert */}
				{error && (
					<div className="mt-8">
						<Alert className="border-rose-900/50 bg-rose-950/20 text-rose-200">
							<ShieldAlert className="h-4 w-4 text-rose-400" />
							<AlertTitle className="text-rose-300 text-sm font-medium">
								Lookup Failed
							</AlertTitle>
							<AlertDescription className="text-xs text-rose-300/90 mt-1">
								{error}
							</AlertDescription>
						</Alert>
					</div>
				)}

				{/* Results View */}
				{result && !loading && (
					<div className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
						<DnsResultsView
							result={result}
							copiedText={copiedText}
							onCopy={handleCopy}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function DnsResultsView({
	result,
	copiedText,
	onCopy,
}: {
	result: DnsReconResult;
	copiedText: string | null;
	onCopy: (text: string) => void;
}) {
	const aRecords = result.A || [];
	const aaaaRecords = result.AAAA || [];
	const mxRecords = result.MX || [];
	const nsRecords = result.NS || [];
	const txtRecords = result.TXT || [];
	const cnameRecords = result.CNAME || [];
	const caaRecords = result.CAA || [];
	const dmarcRecords = result.DMARC || [];
	const soa = result.SOA;

	const totalRecordsCount =
		aRecords.length +
		aaaaRecords.length +
		mxRecords.length +
		nsRecords.length +
		txtRecords.length +
		cnameRecords.length +
		caaRecords.length +
		dmarcRecords.length +
		(soa ? 1 : 0);

	return (
		<>
			{/* Summary Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-border rounded-xl p-5 bg-(--bg-secondary)">
				<div>
					<span className="font-mono text-xs uppercase text-(--link) block">
						Zone Records
					</span>
					<h2 className="text-lg font-semibold text-(--text) mt-0.5">
						{result.name || "Queried Host"}
					</h2>
					<p className="text-xs text-(--text-secondary) mt-1">
						{totalRecordsCount} authoritative records returned across{" "}
						{[
							aRecords.length && "A",
							aaaaRecords.length && "AAAA",
							mxRecords.length && "MX",
							nsRecords.length && "NS",
							txtRecords.length && "TXT",
							dmarcRecords.length && "DMARC",
						]
							.filter(Boolean)
							.join(", ")}{" "}
						sets.
					</p>
				</div>
				<div className="flex flex-wrap gap-1.5 self-start sm:self-center">
					{aRecords.length > 0 && (
						<Badge className="bg-(--bg) border-border text-xs text-(--text) hover:bg-(--bg)">
							{aRecords.length} A
						</Badge>
					)}
					{aaaaRecords.length > 0 && (
						<Badge className="bg-(--bg) border-border text-xs text-(--text) hover:bg-(--bg)">
							{aaaaRecords.length} AAAA
						</Badge>
					)}
					{mxRecords.length > 0 && (
						<Badge className="bg-(--bg) border-border text-xs text-(--text) hover:bg-(--bg)">
							{mxRecords.length} MX
						</Badge>
					)}
					{nsRecords.length > 0 && (
						<Badge className="bg-(--bg) border-border text-xs text-(--text) hover:bg-(--bg)">
							{nsRecords.length} NS
						</Badge>
					)}
				</div>
			</div>

			{/* Address Records (A & AAAA) */}
			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Server className="h-4 w-4 text-(--link)" />
							Address Records (A & AAAA)
						</CardTitle>
						<span className="text-[11px] text-(--text-secondary)">
							{aRecords.length + aaaaRecords.length} IP endpoints
						</span>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{aRecords.length === 0 && aaaaRecords.length === 0 ? (
						<p className="text-xs text-(--text-secondary)">
							No A or AAAA records found.
						</p>
					) : (
						<div className="space-y-2">
							{aRecords.map((ip) => (
								<div
									key={ip}
									className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-(--bg) px-3 py-2 text-xs"
								>
									<div className="flex items-center gap-2 font-mono">
										<Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-[10px] px-1.5 py-0">
											IPv4
										</Badge>
										<span className="text-(--text)">{ip}</span>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => onCopy(ip)}
											className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-(--text)"
										>
											<Copy className="h-3 w-3" />
											{copiedText === ip ? "Copied" : "Copy"}
										</button>
										<Button
											asChild
											variant="ghost"
											size="xs"
											className="text-[11px] text-(--link) hover:text-(--link) hover:bg-(--bg-secondary) h-6 px-2"
										>
											<Link to="/scan">
												<Radar className="mr-1 h-3 w-3" />
												Port Scan IP
											</Link>
										</Button>
									</div>
								</div>
							))}

							{aaaaRecords.map((ip) => (
								<div
									key={ip}
									className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-(--bg) px-3 py-2 text-xs"
								>
									<div className="flex items-center gap-2 font-mono truncate">
										<Badge className="bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 text-[10px] px-1.5 py-0">
											IPv6
										</Badge>
										<span className="text-(--text) truncate">{ip}</span>
									</div>
									<button
										type="button"
										onClick={() => onCopy(ip)}
										className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-(--text) shrink-0"
									>
										<Copy className="h-3 w-3" />
										{copiedText === ip ? "Copied" : "Copy"}
									</button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mail Exchangers & Nameservers */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* MX Records */}
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Mail className="h-4 w-4 text-(--link)" />
							Mail Exchangers (MX) ({mxRecords.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{mxRecords.length === 0 ? (
							<p className="text-xs text-(--text-secondary)">
								No MX records configured.
							</p>
						) : (
							mxRecords.map((mx) => (
								<div
									key={`${mx.priority}-${mx.exchange}`}
									className="flex items-center justify-between border-b border-border/40 pb-2 text-xs"
								>
									<span
										className="font-mono text-(--text) truncate mr-2"
										title={mx.exchange}
									>
										{mx.exchange || "(Empty host)"}
									</span>
									<Badge
										variant="outline"
										className="border-border bg-(--bg) font-mono text-[10px] text-(--text-secondary) shrink-0"
									>
										Priority {mx.priority}
									</Badge>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Nameservers (NS) */}
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Globe className="h-4 w-4 text-(--link)" />
							Authoritative Name Servers (NS) ({nsRecords.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{nsRecords.length === 0 ? (
							<p className="text-xs text-(--text-secondary)">
								No NS records found.
							</p>
						) : (
							nsRecords.map((ns) => (
								<div
									key={ns}
									className="flex items-center justify-between border-b border-border/40 pb-2 text-xs"
								>
									<span className="font-mono text-(--text) truncate">{ns}</span>
									<button
										type="button"
										onClick={() => onCopy(ns)}
										className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-(--text) shrink-0"
									>
										<Copy className="h-3 w-3" />
										{copiedText === ns ? "Copied" : "Copy"}
									</button>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{/* Text & Verification Records (TXT) */}
			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Database className="h-4 w-4 text-(--link)" />
							TXT & SPF Records ({txtRecords.length})
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					{txtRecords.length === 0 ? (
						<p className="text-xs text-(--text-secondary)">
							No TXT records discovered.
						</p>
					) : (
						txtRecords.map((txt, idx) => {
							const isSpf = txt.toLowerCase().startsWith("v=spf1");
							return (
								<div
									key={txt}
									className="rounded-lg border border-border bg-(--bg) p-3 text-xs"
								>
									<div className="flex items-center justify-between mb-1.5">
										{isSpf ? (
											<Badge className="bg-amber-950/40 text-amber-400 border border-amber-800/50 text-[10px] px-1.5 py-0">
												SPF Policy
											</Badge>
										) : (
											<span className="font-mono text-[10px] text-(--text-secondary)">
												TXT Entry #{idx + 1}
											</span>
										)}
										<button
											type="button"
											onClick={() => onCopy(txt)}
											className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-(--text)"
										>
											<Copy className="h-3 w-3" />
											{copiedText === txt ? "Copied" : "Copy"}
										</button>
									</div>
									<p className="font-mono text-xs text-(--text) break-all leading-relaxed">
										{txt}
									</p>
								</div>
							);
						})
					)}
				</CardContent>
			</Card>

			{/* Email Security & Policies (DMARC, CAA) */}
			{(dmarcRecords.length > 0 || caaRecords.length > 0) && (
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-(--link)" />
							Security Policies & Authorization
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{dmarcRecords.length > 0 && (
							<div>
								<span className="text-xs text-(--text-secondary) block mb-1 font-medium">
									DMARC Policy Record
								</span>
								{dmarcRecords.map((dmarc) => (
									<div
										key={dmarc}
										className="rounded border border-border bg-(--bg) p-2 font-mono text-xs text-(--text) break-all"
									>
										{dmarc}
									</div>
								))}
							</div>
						)}

						{caaRecords.length > 0 && (
							<div>
								<span className="text-xs text-(--text-secondary) block mb-1 font-medium">
									CAA (Certificate Authority Authorization)
								</span>
								{caaRecords.map((caa) => (
									<div
										key={caa}
										className="rounded border border-border bg-(--bg) p-2 font-mono text-xs text-(--text) break-all"
									>
										{caa}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Start of Authority (SOA) */}
			{soa && (
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Clock className="h-4 w-4 text-(--link)" />
							Start of Authority (SOA) Zone Parameters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2 text-xs">
							<DetailItem
								label="Primary Name Server"
								value={soa.nsname || "—"}
								isMono
							/>
							<DetailItem
								label="Hostmaster Email"
								value={soa.hostmaster || "—"}
								isMono
							/>
							<DetailItem
								label="Serial Number"
								value={String(soa.serial ?? "—")}
								isMono
							/>
							<DetailItem
								label="Refresh Interval"
								value={soa.refresh ? `${soa.refresh}s` : "—"}
							/>
							<DetailItem
								label="Retry Interval"
								value={soa.retry ? `${soa.retry}s` : "—"}
							/>
							<DetailItem
								label="Expiry Limit"
								value={soa.expire ? `${soa.expire}s` : "—"}
							/>
							<DetailItem
								label="Minimum TTL"
								value={soa.minttl ? `${soa.minttl}s` : "—"}
							/>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}

function DetailItem({
	label,
	value,
	isMono = false,
}: {
	label: string;
	value: string;
	isMono?: boolean;
}) {
	return (
		<div className="border-b border-border/40 pb-1.5">
			<span className="text-(--text-secondary) text-[11px] block">{label}</span>
			<span
				className={`text-(--text) text-xs truncate block ${
					isMono ? "font-mono" : ""
				}`}
				title={value}
			>
				{value}
			</span>
		</div>
	);
}
