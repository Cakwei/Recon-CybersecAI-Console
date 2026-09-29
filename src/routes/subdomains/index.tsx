import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Network, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { type SubmitEvent, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { enumerateSubdomains } from "../api/v1/subdomain";

export const Route = createFileRoute("/subdomains/")({
	component: SubdomainsPage,
});

interface SubdomainResult {
	domain: string;
	totalDiscovered: number;
	active: { subdomain: string; addresses: string[] }[];
}

function SubdomainsPage() {
	const [domain, setDomain] = useState("");
	const [result, setResult] = useState<SubdomainResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const enumerate = useServerFn(enumerateSubdomains);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const target = domain.trim().toLowerCase();
		setError(null);
		setResult(null);
		setLoading(true);
		try {
			const data = await enumerate({ data: { domain: target } });
			setResult({ domain: target, ...data });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-2xl px-6 py-16">
				<header className="mb-10">
					<p className="font-mono text-xs tracking-wide text-(--text-secondary)">
						subdomain enumeration
					</p>
					<h1 className="mt-1 text-2xl font-semibold text-(--text)">
						Find subdomains from certificate logs
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary)">
						Pulls every name seen in public certificates via crt.sh, then checks
						which ones currently resolve in DNS.
					</p>
				</header>

				<form onSubmit={handleSubmit} className="space-y-3">
					<Label htmlFor="domain" className="text-(--text-secondary)">
						Domain
					</Label>
					<div className="flex gap-2">
						<Input
							id="domain"
							placeholder="example.com"
							value={domain}
							onChange={(e) => setDomain(e.target.value)}
							autoComplete="off"
							spellCheck={false}
							className="border-border bg-(--bg-secondary) text-xs font-mono text-(--text) placeholder:text-(--text-secondary) focus-visible:ring-(--link)"
						/>
						<Button
							type="submit"
							disabled={loading || !domain.trim()}
							className="bg-(--link) text-xs text-(--bg) hover:opacity-90"
						>
							<Search className="mr-1.5 h-4 w-4" />
							{loading ? "Enumerating…" : "Enumerate"}
						</Button>
					</div>
					{loading && (
						<p className="text-xs text-(--text-secondary)">
							Large domains can take 10+ seconds while DNS checks run.
						</p>
					)}
				</form>

				<div className="mt-8">
					{loading && <ResultSkeleton />}

					{error && (
						<Alert className="border-[#3A2420] bg-[#1C1310]">
							<ShieldAlert className="h-4 w-4 text-[#E8A33D]" />
							<AlertTitle className="text-[#F0B79A]">
								Enumeration failed
							</AlertTitle>
							<AlertDescription className="text-[#C99C7E]">
								{error}
							</AlertDescription>
						</Alert>
					)}

					{result && <ResultReport data={result} />}
				</div>
			</div>
		</div>
	);
}

function ResultSkeleton() {
	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader>
				<Skeleton className="h-5 w-40 bg-border" />
				<Skeleton className="h-4 w-64 bg-border" />
			</CardHeader>
			<CardContent className="space-y-3">
				<Skeleton className="h-4 w-full bg-border" />
				<Skeleton className="h-4 w-full bg-border" />
				<Skeleton className="h-4 w-3/4 bg-border" />
			</CardContent>
		</Card>
	);
}

function ResultReport({ data }: { data: SubdomainResult }) {
	const [filter, setFilter] = useState("");
	const inactive = data.totalDiscovered - data.active.length;

	const rows = useMemo(() => {
		const q = filter.trim().toLowerCase();
		return [...data.active]
			.sort((a, b) => a.subdomain.localeCompare(b.subdomain))
			.filter((r) => !q || r.subdomain.includes(q));
	}, [data.active, filter]);

	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader>
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="font-mono text-lg text-(--text)">
						{data.domain}
					</CardTitle>
					{data.active.length > 0 ? (
						<Badge className="gap-1 bg-[#122420] text-[#4CBB8E] hover:bg-[#122420]">
							<ShieldCheck className="h-3 w-3" />
							{data.active.length} active
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="border-border text-(--text-secondary)"
						>
							None active
						</Badge>
					)}
				</div>
				<CardDescription className="text-(--text-secondary)">
					{data.totalDiscovered} discovered in certificate logs
					{inactive > 0 && ` · ${inactive} no longer resolve`}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center gap-1.5 text-xs text-(--text-secondary)">
					<Network className="h-4 w-4" />
					<span>Active subdomains</span>
				</div>

				{data.active.length > 0 && (
					<Input
						placeholder="Filter results"
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						autoComplete="off"
						spellCheck={false}
						className="border-border bg-(--bg) font-mono text-sm text-(--text) placeholder:text-(--text-secondary) focus-visible:ring-(--link)"
					/>
				)}

				{rows.length > 0 ? (
					<ul className="divide-y divide-border border-y border-border">
						{rows.map((row) => (
							<li
								key={row.subdomain}
								className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<span className="break-all font-mono text-sm text-(--text)">
									{row.subdomain}
								</span>
								<div className="flex flex-wrap gap-1.5">
									{row.addresses.map((addr) => (
										<Badge
											key={addr}
											variant="outline"
											className="border-border font-mono text-[10px] text-(--text-secondary)"
										>
											{addr}
										</Badge>
									))}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-(--text-secondary)">
						{data.active.length === 0
							? "No subdomains currently resolve."
							: "No matches for that filter."}
					</p>
				)}

				<Separator className="bg-border" />

				<div className="flex items-center gap-1.5 text-xs text-(--text-secondary)">
					<Globe className="h-4 w-4" />
					<span>
						Source: crt.sh certificate transparency logs, resolved via DNS A
						records.
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
