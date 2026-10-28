import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Copy,
	Globe,
	Lock,
	Network,
	Radar,
	Search,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { type SubmitEvent, useMemo, useState } from "react";
import { domainSchema } from "#/lib/schema.ts";
import type { DomainEnumerationResult } from "#/lib/types.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { enumerateDomainServerFn } from "#/lib/whoisjson.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/subdomains/")({
	component: DomainEnumerationPage,
});

function DomainEnumerationPage() {
	const [result, setResult] = useState<DomainEnumerationResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedText, setCopiedText] = useState<string | null>(null);

	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 5,
			windowMs: 10000,
			name: "Subdomain enumeration",
		});

	const enumerate = useServerFn(enumerateDomainServerFn);

	const subdomainForm = useForm({
		defaultValues: { domainName: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			setResult(null);
			setLoading(true);

			try {
				const data = await enumerate({ data: { domain: value.domainName } });
				setResult(data);
			} catch (err: unknown) {
				setError(
					err instanceof Error ? err.message : "Domain enumeration failed.",
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
			subdomainForm.handleSubmit();
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
							<Link to="/dns">DNS Recon</Link>
						</Button>
					</div>
				</div>

				{/* Page Header */}
				<header className="mb-10">
					<div className="mb-2 flex items-center gap-2 text-(--link)">
						<Network className="h-5 w-5" />
						<span className="font-mono text-xs tracking-wide uppercase">
							Attack Surface Mapping
						</span>
					</div>
					<h1 className="text-2xl font-semibold sm:text-3xl text-(--text)">
						Domain & Subdomain Enumeration
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary) max-w-xl">
						Discover active subdomains, A/CNAME mappings, and resolved IP
						endpoints using WhoisJSON parallel DNS brute-force with automatic
						wildcard detection.
					</p>
				</header>

				{/* Search Form */}
				<form onSubmit={handleSearch} className="space-y-3">
					<Label
						htmlFor="domainName"
						className="text-xs text-(--text-secondary)"
					>
						Root Domain
					</Label>
					<div className="flex gap-2.5">
						<subdomainForm.Field
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
						</subdomainForm.Field>

						<subdomainForm.Subscribe
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
											? "Enumerating…"
											: isExceeded
												? "Rate limited"
												: "Enumerate Subdomains"}
									</Button>
								);
							}}
						</subdomainForm.Subscribe>
					</div>

					{rateLimitError && (
						<Alert className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-2">
							<AlertDescription>{rateLimitError}</AlertDescription>
						</Alert>
					)}

					<div className="w-full">
						<subdomainForm.Field name="domainName">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs mt-1.5 text-red-500">
										{field.state.meta.errors}
									</Label>
								)
							}
						</subdomainForm.Field>
					</div>

					<p className="text-[11px] text-(--text-secondary)/80">
						Fast parallel DNS resolution testing common subdomains (e.g. www,
						api, cdn, mail).
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
								Enumeration Failed
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
						<EnumerationResultsView
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

function EnumerationResultsView({
	result,
	copiedText,
	onCopy,
}: {
	result: DomainEnumerationResult;
	copiedText: string | null;
	onCopy: (text: string) => void;
}) {
	const [filter, setFilter] = useState("");

	const subdomains = result.subdomains || [];

	const filteredSubdomains = useMemo(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return subdomains;
		return subdomains.filter(
			(item) =>
				item.subdomain.toLowerCase().includes(q) ||
				item.ips.some((ip) => ip.toLowerCase().includes(q)),
		);
	}, [subdomains, filter]);

	return (
		<>
			{/* KPI Stats Cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<Network className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Active Discovered</span>
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-semibold text-(--text)">
							{result.total_found}
						</span>
						<span className="text-xs text-(--text-secondary)">subdomains</span>
					</div>
				</div>

				<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
					<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
						<Clock className="h-4 w-4 text-(--link)" />
						<span className="text-xs font-medium">Scan Duration</span>
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-semibold text-(--text)">
							{result.scan_time_ms}
						</span>
						<span className="text-xs text-(--text-secondary)">ms</span>
					</div>
				</div>
			</div>

			<div className="w-full flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
				<div className="flex items-center gap-2 text-(--text-secondary) mb-2">
					<ShieldCheck className="h-4 w-4 text-(--link)" />
					<span className="text-xs font-medium">Wildcard Detection</span>
				</div>
				<div>
					{result.wildcard_detected ? (
						<Badge className="bg-amber-950/40 text-amber-400 border border-amber-800/50 text-xs">
							<AlertTriangle className="mr-1 h-3 w-3" />
							Wildcard Active (*.{result.domain})
						</Badge>
					) : (
						<Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-xs">
							<CheckCircle2 className="mr-1 h-3 w-3" />
							No Wildcard (Clean)
						</Badge>
					)}
				</div>
			</div>
			{/* Subdomain Records Card */}
			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<CardTitle className="text-sm font-semibold text-(--text) flex items-center gap-2 font-mono">
								<Globe className="h-4 w-4 text-(--link)" />
								{result.domain}
							</CardTitle>
							<p className="text-xs text-(--text-secondary) mt-1">
								Showing {filteredSubdomains.length} of {subdomains.length}{" "}
								discovered subdomains
							</p>
						</div>

						{subdomains.length > 0 && (
							<div className="w-full sm:w-64">
								<Input
									placeholder="Filter subdomains or IPs…"
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
									autoComplete="off"
									spellCheck={false}
									className="border-border bg-(--bg) text-xs font-mono h-8 text-(--text) placeholder:text-(--text-secondary)/60 focus-visible:ring-(--link)"
								/>
							</div>
						)}
					</div>
				</CardHeader>

				<CardContent>
					{filteredSubdomains.length === 0 ? (
						<div className="text-center py-8 text-xs text-(--text-secondary)">
							{subdomains.length === 0
								? "No active subdomains resolved for this target."
								: "No subdomains match your current filter."}
						</div>
					) : (
						<div className="divide-y divide-border/50 border-t border-border">
							{filteredSubdomains.map((item) => (
								<div
									key={item.subdomain}
									className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 py-3 text-xs"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-mono font-medium text-(--text) break-all">
												{item.subdomain}
											</span>
											<Badge
												variant="outline"
												className="border-border bg-(--bg) text-[10px] font-mono px-1.5 py-0 text-(--text-secondary)"
											>
												{item.type}
											</Badge>
										</div>
										<div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-(--text-secondary)">
											{item.ips.map((ip) => (
												<span
													key={ip}
													className="rounded bg-(--bg) border border-border/60 px-1.5 py-0.5"
												>
													{ip}
												</span>
											))}
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
										<button
											type="button"
											onClick={() => onCopy(item.subdomain)}
											className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-(--text)"
										>
											<Copy className="h-3 w-3" />
											{copiedText === item.subdomain ? "Copied" : "Copy"}
										</button>

										<Button
											asChild
											variant="ghost"
											size="xs"
											className="text-[11px] text-(--link) hover:text-(--link) hover:bg-(--bg) h-6 px-2"
										>
											<Link to="/ssl">
												<Lock className="mr-1 h-3 w-3" />
												SSL
											</Link>
										</Button>

										{item.ips.length > 0 && (
											<Button
												asChild
												variant="ghost"
												size="xs"
												className="text-[11px] text-(--link) hover:text-(--link) hover:bg-(--bg) h-6 px-2"
											>
												<Link to="/scan">
													<Radar className="mr-1 h-3 w-3" />
													Scan
												</Link>
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
