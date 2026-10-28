import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	Copy,
	Globe,
	Key,
	Lock,
	Search,
	Server,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { domainSchema } from "#/lib/schema.ts";
import type { SslAuditResult } from "#/lib/types.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { auditSslServerFn } from "#/lib/whoisjson.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/ssl/")({
	component: SslAuditPage,
});

function SslAuditPage() {
	const [result, setResult] = useState<SslAuditResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 5,
			windowMs: 10000,
			name: "SSL audit",
		});

	const auditSsl = useServerFn(auditSslServerFn);

	const sslAuditForm = useForm({
		defaultValues: { domainName: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			setResult(null);
			setLoading(true);

			try {
				const data = await auditSsl({ data: { domain: value.domainName } });
				setResult(data);
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : "SSL/TLS audit failed.");
			} finally {
				setLoading(false);
			}
		},
	});

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		executeWithRateLimit(() => {
			sslAuditForm.handleSubmit();
		});
	};

	function handleCopy(text: string, key: string) {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		setTimeout(() => setCopiedKey(null), 2000);
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
							<Link to="/dns">DNS Recon</Link>
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
						<Lock className="h-5 w-5" />
						<span className="font-mono text-xs tracking-wide uppercase">
							Cryptographic Security
						</span>
					</div>
					<h1 className="text-2xl font-semibold sm:text-3xl text-(--text)">
						SSL/TLS Certificate Audit
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary) max-w-xl">
						Inspect certificate validity, issuer authority, expiration timeline,
						SANs, and cryptographic cipher parameters via WhoisJSON.
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
						<sslAuditForm.Field
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
										placeholder="Enter domain (e.g., github.com)"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										autoComplete="off"
										spellCheck={false}
										className="border-border bg-(--bg-secondary) pl-9 font-mono text-xs text-(--text) placeholder:text-(--text-secondary)/60 focus-visible:ring-(--link)"
									/>
								</div>
							)}
						</sslAuditForm.Field>

						<sslAuditForm.Subscribe
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
											? "Auditing…"
											: isExceeded
												? "Rate limited"
												: "Audit Certificate"}
									</Button>
								);
							}}
						</sslAuditForm.Subscribe>
					</div>

					{rateLimitError && (
						<Alert className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-2">
							<AlertDescription>{rateLimitError}</AlertDescription>
						</Alert>
					)}

					<div className="w-full">
						<sslAuditForm.Field name="domainName">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs mt-1.5 text-red-500">
										{field.state.meta.errors}
									</Label>
								)
							}
						</sslAuditForm.Field>
					</div>

					<p className="text-[11px] text-(--text-secondary)/80">
						Passive TLS handshake inspection. No intrusion or active packets
						sent.
					</p>
				</form>

				{/* Loading Skeleton */}
				{loading && (
					<div className="mt-10 space-y-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{[1, 2, 3, 4].map((i) => (
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
								Audit Failed
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
						<SslResultsView
							result={result}
							copiedKey={copiedKey}
							onCopy={handleCopy}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function SslResultsView({
	result,
	copiedKey,
	onCopy,
}: {
	result: SslAuditResult;
	copiedKey: string | null;
	onCopy: (text: string, key: string) => void;
}) {
	const validFrom = result.valid_from ? new Date(result.valid_from) : null;
	const validTo = result.valid_to ? new Date(result.valid_to) : null;
	const now = new Date();

	const daysLeft = validTo
		? Math.max(
				0,
				Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
			)
		: null;

	const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
	const isExpired = !result.valid || (daysLeft !== null && daysLeft === 0);

	const issuerName =
		result.issuer?.O ||
		result.details?.issuer?.O ||
		result.issuer?.CN ||
		result.details?.issuer?.CN ||
		"Unknown CA";

	const subjectCN = result.details?.subject?.CN || result.domain || "Unknown";

	const sans = result.details?.subjectaltname
		? result.details.subjectaltname
				.split(",")
				.map((s) => s.trim().replace(/^DNS:/, ""))
				.filter(Boolean)
		: [result.domain];

	const cipherBits = result.details?.bits ?? 256;
	const curve =
		result.details?.nistCurve || result.details?.asn1Curve || "RSA / ECDSA";

	return (
		<>
			{/* Top KPI Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<ShieldCheck className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Status</span>
					</div>
					<div>
						{result.valid && !isExpired ? (
							<Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-950/40 text-xs">
								<CheckCircle2 className="mr-1 h-3 w-3" />
								Valid Certificate
							</Badge>
						) : (
							<Badge className="bg-rose-950/40 text-rose-400 border border-rose-800/50 hover:bg-rose-950/40 text-xs">
								<AlertTriangle className="mr-1 h-3 w-3" />
								{isExpired ? "Expired Certificate" : "Invalid Certificate"}
							</Badge>
						)}
					</div>
				</div>

				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<Server className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Issuer Authority</span>
					</div>
					<span
						className="text-sm font-semibold text-(--text) truncate"
						title={issuerName}
					>
						{issuerName}
					</span>
					<span className="text-[11px] text-(--text-secondary) truncate mt-0.5">
						{result.issuer?.CN || "Standard Authority"}
					</span>
				</div>

				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<Clock className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Expiration</span>
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-sm font-semibold text-(--text)">
							{daysLeft !== null ? `${daysLeft}d left` : "—"}
						</span>
						{isExpiringSoon && (
							<Badge className="bg-amber-950/40 text-amber-400 border border-amber-800/50 text-[10px] px-1.5 py-0">
								Expiring Soon
							</Badge>
						)}
					</div>
					<span className="text-[11px] text-(--text-secondary) mt-0.5">
						{validTo ? validTo.toLocaleDateString() : "—"}
					</span>
				</div>

				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<Key className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Cipher & Key</span>
					</div>
					<span className="text-sm font-semibold text-(--text)">
						{cipherBits}-bit
					</span>
					<span className="text-[11px] text-(--text-secondary) mt-0.5">
						{curve}
					</span>
				</div>
			</div>

			{/* Main Detail Cards */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Subject & Issuer Details */}
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Lock className="h-4 w-4 text-(--link)" />
							Certificate Subject & Issuer
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<DetailRow label="Subject Common Name (CN)" value={subjectCN} />
						<DetailRow label="Issuer Organization" value={issuerName} />
						<DetailRow
							label="Issuer Country"
							value={result.issuer?.C || result.details?.issuer?.C || "—"}
						/>
						<DetailRow
							label="Serial Number"
							value={result.details?.serialNumber || "—"}
							isMono
						/>
					</CardContent>
				</Card>

				{/* Validity Timeline */}
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Calendar className="h-4 w-4 text-(--link)" />
							Validity Timeline
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<DetailRow
							label="Valid From"
							value={validFrom ? validFrom.toUTCString() : "—"}
							isMono
						/>
						<DetailRow
							label="Valid To (Expires)"
							value={validTo ? validTo.toUTCString() : "—"}
							isMono
						/>
						<DetailRow
							label="Days Remaining"
							value={daysLeft !== null ? `${daysLeft} calendar days` : "—"}
						/>
						<DetailRow
							label="Status Check"
							value={result.valid ? "Active & Trusted" : "Untrusted / Invalid"}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Subject Alternative Names (SANs) */}
			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Globe className="h-4 w-4 text-(--link)" />
							Subject Alternative Names ({sans.length})
						</CardTitle>
						<span className="text-[11px] text-(--text-secondary)">
							Covered Hostnames
						</span>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{sans.map((name) => (
							<Badge
								key={name}
								variant="outline"
								className="border-border bg-(--bg) font-mono text-xs text-(--text)"
							>
								{name}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Cryptographic Fingerprints */}
			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3">
					<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
						<Key className="h-4 w-4 text-(--link)" />
						Cryptographic Fingerprints
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{result.details?.fingerprint256 && (
						<div>
							<div className="flex items-center justify-between text-xs text-(--text-secondary) mb-1">
								<span>SHA-256 Fingerprint</span>
								<button
									type="button"
									onClick={() =>
										onCopy(result.details?.fingerprint256 || "", "sha256")
									}
									className="flex items-center gap-1 hover:text-(--text) text-[11px]"
								>
									<Copy className="h-3 w-3" />
									{copiedKey === "sha256" ? "Copied" : "Copy"}
								</button>
							</div>
							<div className="rounded border border-border bg-(--bg) p-2 font-mono text-xs text-(--text) break-all">
								{result.details.fingerprint256}
							</div>
						</div>
					)}

					{result.details?.fingerprint && (
						<div>
							<div className="flex items-center justify-between text-xs text-(--text-secondary) mb-1">
								<span>SHA-1 Fingerprint</span>
								<button
									type="button"
									onClick={() =>
										onCopy(result.details?.fingerprint || "", "sha1")
									}
									className="flex items-center gap-1 hover:text-(--text) text-[11px]"
								>
									<Copy className="h-3 w-3" />
									{copiedKey === "sha1" ? "Copied" : "Copy"}
								</button>
							</div>
							<div className="rounded border border-border bg-(--bg) p-2 font-mono text-xs text-(--text) break-all">
								{result.details.fingerprint}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}

function DetailRow({
	label,
	value,
	isMono = false,
}: {
	label: string;
	value: string;
	isMono?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2 sm:flex-col sm:items-start sm:gap-0.5">
			<dt className="text-xs text-(--text-secondary)">{label}</dt>
			<dd
				className={`text-xs text-(--text) truncate max-w-full ${
					isMono ? "font-mono" : ""
				}`}
				title={value}
			>
				{value}
			</dd>
		</div>
	);
}
