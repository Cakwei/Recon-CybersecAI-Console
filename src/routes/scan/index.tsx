import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	Globe,
	Search,
	Server,
	ShieldAlert,
	ShieldCheck,
	Tag,
} from "lucide-react";
import { type ReactNode, type SubmitEvent, useState } from "react";

import { ipSchema } from "#/lib/schema.ts";
import { lookupHost } from "#/lib/server.ts";
import type { InternetDBResult } from "#/lib/types.ts";
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

export const Route = createFileRoute("/scan/")({
	component: ScanPage,
});

function ScanPage() {
	const [result, setResult] = useState<InternetDBResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const lookup = useServerFn(lookupHost);

	const scanForm = useForm({
		defaultValues: { ip: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			setResult(null);
			setLoading(true);
			try {
				const data = await lookup({ data: { ip: value.ip.trim() } });
				setResult(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong.");
			} finally {
				setLoading(false);
			}
		},
	});

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		scanForm.handleSubmit();
	};

	return (
		<div className="min-h-screen bg-(--bg) text-(--text)">
			<div className="mx-auto max-w-2xl px-6 py-16">
				<header className="mb-10">
					<p className="font-mono text-xs tracking-wide text-(--text-secondary)">
						Host Reconnaissance
					</p>
					<h1 className="mt-1 text-2xl font-semibold text-(--text)">
						Look up an IP on Shodan InternetDB
					</h1>
					<p className="mt-2 text-sm text-(--text-secondary)">
						Open ports, hostnames, and known CVEs for any public IP — no API key
						required.
					</p>
				</header>

				<form onSubmit={handleSubmit} className="space-y-3">
					<Label htmlFor="ip" className="text-(--text-secondary)">
						IP address
					</Label>
					<div className="flex gap-2">
						<scanForm.Field
							name="ip"
							validators={{
								onChange: ({ value }) => {
									const trimmed = value.trim();
									if (!trimmed) {
										return "IP address is required";
									}
									const parseResult = ipSchema.safeParse(trimmed);
									if (!parseResult.success) {
										return (
											parseResult.error.issues[0]?.message ||
											"Enter a valid IPv4 address"
										);
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<Input
									id={field.name}
									name={field.name}
									placeholder="8.8.8.8"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="off"
									spellCheck={false}
									className="border-border text-sm bg-(--bg-secondary) font-mono text-(--text) placeholder:text-(--text-secondary) focus-visible:ring-(--link)"
								/>
							)}
						</scanForm.Field>

						<scanForm.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
								state.values.ip,
								state.errors,
							]}
						>
							{([canSubmit, isSubmitting, ipValue, errors]) => {
								const isValid =
									typeof ipValue === "string" &&
									ipValue.trim().length > 0 &&
									ipSchema.safeParse(ipValue).success &&
									errors.length === 0;

								return (
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting || loading || !isValid}
										className="bg-(--link) hover:bg-(--link)/80 text-xs hover:opacity-90 text-white shrink-0"
									>
										<Search className="h-4 w-4" />
										{isSubmitting || loading ? "Scanning…" : "Scan"}
									</Button>
								);
							}}
						</scanForm.Subscribe>
					</div>

					<div className="w-full">
						<scanForm.Field name="ip">
							{(field) =>
								field.state.meta.isDirty &&
								field.state.meta.errors.length > 0 && (
									<Label className="text-xs mt-1.5 text-red-500">
										{field.state.meta.errors}
									</Label>
								)
							}
						</scanForm.Field>
					</div>
				</form>

				<div className="mt-8">
					{loading && <ResultSkeleton />}

					{error && (
						<Alert className="border-[#3A2420] bg-[#1C1310]">
							<ShieldAlert className="h-4 w-4 text-[#E8A33D]" />
							<AlertTitle className="text-[#F0B79A]">Lookup failed</AlertTitle>
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
				<Skeleton className="h-4 w-3/4 bg-border" />
			</CardContent>
		</Card>
	);
}

function ResultReport({ data }: { data: InternetDBResult }) {
	const hasVulns = data.vulns.length > 0;

	return (
		<Card className="border-border bg-(--bg-secondary)">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="font-mono text-lg text-(--text)">
						{data.ip}
					</CardTitle>
					{hasVulns ? (
						<Badge className="gap-1 bg-[#2A1B12] text-[#E8A33D] hover:bg-[#2A1B12]">
							<ShieldAlert className="h-3 w-3" />
							{data.vulns.length} known{" "}
							{data.vulns.length === 1 ? "CVE" : "CVEs"}
						</Badge>
					) : (
						<Badge className="gap-1 bg-[#122420] text-[#4CBB8E] hover:bg-[#122420]">
							<ShieldCheck className="h-3 w-3" />
							No known CVEs
						</Badge>
					)}
				</div>
				<CardDescription className="text-(--text-secondary)">
					{data.hostnames.length > 0
						? data.hostnames.join(", ")
						: "No hostnames on record"}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-6">
				<Section icon={<Server className="h-4 w-4" />} label="Open ports">
					{data.ports.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{[...data.ports]
								.sort((a, b) => a - b)
								.map((port) => (
									<Badge
										key={port}
										variant="outline"
										className="border-border font-mono text-(--text)"
									>
										{port}
									</Badge>
								))}
						</div>
					) : (
						<EmptyRow text="No open ports reported" />
					)}
				</Section>

				<Separator className="bg-border" />

				<Section icon={<Globe className="h-4 w-4" />} label="Hostnames">
					{data.hostnames.length > 0 ? (
						<ul className="space-y-1 font-mono text-sm text-(--text)">
							{data.hostnames.map((h) => (
								<li key={h}>{h}</li>
							))}
						</ul>
					) : (
						<EmptyRow text="None on record" />
					)}
				</Section>

				<Separator className="bg-border" />

				<Section
					icon={<Tag className="h-4 w-4" />}
					label="Tags & software (CPEs)"
				>
					{data.tags.length === 0 && data.cpes.length === 0 ? (
						<EmptyRow text="None on record" />
					) : (
						<div className="flex flex-wrap gap-1.5">
							{data.tags.map((t) => (
								<Badge
									key={t}
									variant="outline"
									className="border-border text-(--text-secondary)"
								>
									{t}
								</Badge>
							))}
							{data.cpes.map((c) => (
								<Badge
									key={c}
									variant="outline"
									className="border-border font-mono text-[10px] text-(--text-secondary)"
								>
									{c}
								</Badge>
							))}
						</div>
					)}
				</Section>

				{hasVulns && (
					<>
						<Separator className="bg-border" />
						<Section
							icon={<ShieldAlert className="h-4 w-4 text-[#E8A33D]" />}
							label="Known vulnerabilities"
						>
							<div className="flex flex-wrap gap-1.5">
								{data.vulns.map((v) => (
									<Badge
										key={v}
										className="bg-[#2A1B12] font-mono text-[#E8A33D] hover:bg-[#2A1B12]"
									>
										{v}
									</Badge>
								))}
							</div>
						</Section>
					</>
				)}
			</CardContent>
		</Card>
	);
}

function Section({
	icon,
	label,
	children,
}: {
	icon: ReactNode;
	label: string;
	children: ReactNode;
}) {
	return (
		<div>
			<div className="mb-2 flex items-center gap-1.5 text-xs text-(--text-secondary)">
				{icon}
				<span>{label}</span>
			</div>
			{children}
		</div>
	);
}

function EmptyRow({ text }: { text: string }) {
	return <p className="text-sm text-(--text-secondary)">{text}</p>;
}
