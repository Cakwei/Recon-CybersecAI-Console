import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
	Calendar,
	Clock,
	FileText,
	Globe,
	Search,
	Server,
	Shield,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Badge } from "#/components/ui/badge.tsx";
import { Label } from "#/components/ui/label.tsx";
import { axios } from "#/lib/axios.ts";
import { domainSchema } from "#/lib/schema.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/whois/")({
	component: WhoisPage,
});

// Mock type for demonstration
interface WhoisData {
	name: string;
	status: string[];
	nameserver: string[];
	nsAnalysis: {
		detectedProviders: string[];
	};
	ips: string;
	created: string;
	changed: string;
	expires: string;
	age: {
		days: number;
		months: number;
		years: number;
	};
	expiration: {
		daysLeft: number;
		isExpiringSoon: boolean;
		isExpired: boolean;
	};
	dnssec: string;
	source: string;
	registrar: {
		name: string;
		email: string | null;
	};
}

function WhoisPage() {
	// const [query, setQuery] = useState("");
	// const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<WhoisData | null>(null);

	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 5,
			windowMs: 10000,
			name: "WHOIS lookup",
		});

	const domainLookUpForm = useForm({
		defaultValues: { domainName: "" },
		onSubmit: async ({ value }) => {
			const result = await axios.get("/whois", { params: value });
			// logger.debug({ fah: result.data });

			if (!result.data.success) {
				return;
			}
			// console.log(result.data.data)
			setResult(result.data.data);
		},
	});

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		executeWithRateLimit(() => {
			domainLookUpForm.handleSubmit();
		});
	};

	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-4xl px-6 py-12">
				<Header />

				<form onSubmit={handleSearch} className="mt-8">
					<div className="flex w-full gap-2.5">
						<domainLookUpForm.Field
							name="domainName"
							validators={{
								onChange: ({ value }) => {
									const trimmed = value.trim();
									if (!trimmed) {
										return "Domain name is required";
									}
									const result = domainSchema.safeParse(trimmed);

									if (!result.success) {
										return (
											result.error.issues[0]?.message || "Invalid domain name"
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
										type="text"
										placeholder="Enter domain (e.g., example.com)"
										value={field.state.value}
										name={field.name}
										id={field.name}
										onChange={(e) => field.handleChange(e.target.value)}
										className="bg-(--bg) pl-9 border-border focus-visible:ring-(--link) text-xs"
									/>
								</div>
							)}
						</domainLookUpForm.Field>
						<domainLookUpForm.Subscribe
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
											!canSubmit || isSubmitting || !isValid || isExceeded
										}
										className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80 shrink-0"
									>
										{isSubmitting
											? "Scanning..."
											: isExceeded
												? "Rate limited"
												: "Lookup"}
									</Button>
								);
							}}
						</domainLookUpForm.Subscribe>
					</div>

					{rateLimitError && (
						<Alert className="mt-3 border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-2">
							<AlertDescription>{rateLimitError}</AlertDescription>
						</Alert>
					)}

					<div className="w-full">
						<domainLookUpForm.Field name="domainName">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs mt-1.5 text-red-500">
										{field.state.meta.errors}
									</Label>
								)
							}
						</domainLookUpForm.Field>
					</div>
				</form>

				<div className="mt-12">
					{!result ? <EmptyState /> : result ? <Results data={result} /> : null}
				</div>
			</div>
		</div>
	);
}

function Header() {
	return (
		<div>
			<div className="mb-2 flex items-center gap-2 text-(--link)">
				<Globe className="h-5 w-5" />
				<span className="font-mono text-xs tracking-wide uppercase">
					Domain Intelligence
				</span>
			</div>
			<h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
				WHOIS Lookup
			</h1>
			<p className="mt-2 text-sm text-(--text-secondary) max-w-xl">
				Query domain registration details, name servers, and registry status.
				Data is fetched directly from the authoritative registry.
			</p>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
			<Search className="h-8 w-8 text-(--text-secondary)/50" />
			<h3 className="mt-4 text-sm font-medium text-(--text)">
				No domain queried
			</h3>
			<p className="mt-1 text-xs text-(--text-secondary)">
				Enter a domain name above to retrieve its WHOIS record.
			</p>
		</div>
	);
}

function Results({ data }: { data: WhoisData }) {
	const ipList = data.ips ? data.ips.split(",").map((ip) => ip.trim()) : [];

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard icon={<Globe />} title="Domain" value={data.name} />
				<StatCard
					icon={<Shield />}
					title="Registrar"
					value={data.registrar.name}
				/>
				<StatCard
					icon={<Calendar />}
					title="Registered On"
					value={new Date(data.created).toLocaleDateString()}
				/>
				<StatCard
					icon={<Clock />}
					title="Expires"
					value={`${new Date(data.expires).toLocaleDateString()} · ${data.expiration.daysLeft}d left`}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Server className="h-4 w-4 text-(--link)" />
							Name Servers
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<ul className="space-y-2">
							{data.nameserver.map((ns) => (
								<li
									key={ns}
									className="font-mono text-xs text-(--text-secondary)"
								>
									{ns}
								</li>
							))}
						</ul>
						{data.nsAnalysis.detectedProviders.length > 0 && (
							<div className="flex flex-wrap gap-1.5 pt-1">
								{data.nsAnalysis.detectedProviders.map((provider) => (
									<Badge
										key={provider}
										variant="outline"
										className="border-border text-(--text-secondary) text-[10px] capitalize"
									>
										{provider}
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="bg-(--bg-secondary) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
							<Shield className="h-4 w-4 text-(--link)" />
							Domain Status
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{data.status.map((status) => (
								<li
									key={status}
									className="font-mono text-xs text-(--text-secondary)"
								>
									{status}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card className="bg-(--bg-secondary) border-border">
				<CardHeader className="pb-3 border-b border-border">
					<CardTitle className="text-xs text-(--text-secondary) font-medium flex items-center gap-2">
						<FileText className="h-4 w-4 text-(--link)" />
						Additional Details
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
						<DetailRow label="DNSSEC" value={data.dnssec} />
						<DetailRow label="IP address" value={ipList.join(", ") || "—"} />
						<DetailRow
							label="Domain age"
							value={`${data.age.years}y ${data.age.months}m (${data.age.days}d)`}
						/>
						<DetailRow label="Last changed" value={data.changed} />
						<DetailRow label="Source" value={data.source.toUpperCase()} />
						<DetailRow
							label="Registrar contact"
							value={data.registrar.email ?? "—"}
						/>
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 sm:flex-col sm:items-start sm:gap-1">
			<dt className="text-xs text-(--text-secondary)">{label}</dt>
			<dd className="font-mono text-xs text-(--text)">{value}</dd>
		</div>
	);
}

function StatCard({
	icon,
	title,
	value,
}: {
	icon: React.ReactNode;
	title: string;
	value: string;
}) {
	return (
		<div className="flex flex-col border border-border rounded-lg p-4 bg-(--bg-secondary)">
			<div className="flex items-center gap-2 text-(--text-secondary) mb-3">
				<div className="h-4 w-4 [&>svg]:h-full [&>svg]:w-full text-(--link)">
					{icon}
				</div>
				<span className="text-xs font-medium">{title}</span>
			</div>
			<span
				className="text-sm font-semibold text-(--text) truncate"
				title={value}
			>
				{value}
			</span>
		</div>
	);
}
