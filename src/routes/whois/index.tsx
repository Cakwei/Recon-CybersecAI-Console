import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
	Calendar,
	FileText,
	Globe,
	Search,
	Server,
	Shield,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { z } from "zod";
import { Label } from "#/components/ui/label.tsx";
import { axios } from "#/lib/axios.ts";
import { domainSchema } from "#/lib/schema.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/whois/")({
	component: WhoisPage,
});

// Mock type for demonstration
type WhoisData = {
	domain: string;
	registrar: string;
	creationDate: string;
	expirationDate: string;
	status: string[];
	nameServers: string[];
	rawText: string;
};

function WhoisPage() {
	// const [query, setQuery] = useState("");
	// const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<WhoisData | null>(null);

	const domainLookUpForm = useForm({
		defaultValues: { domainName: "" },
		onSubmit: async ({ value }) => {
			const result = await axios.get("/whois", { params: value });

			if (!result.data.success) {
				return;
			}

			setResult(result.data);
		},
	});

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		e.stopPropagation();
		domainLookUpForm.handleSubmit();
		/* if (!query) return;

		setIsLoading(true);
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Mock result
		setResult({
			domain: query.toLowerCase(),
			registrar: "Cloudflare, Inc.",
			creationDate: "2010-09-28T00:00:00Z",
			expirationDate: "2027-09-28T00:00:00Z",
			status: ["clientTransferProhibited", "serverUpdateProhibited"],
			nameServers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
			rawText: `Domain Name: ${query.toUpperCase()}\nRegistry Domain ID: 123456789_DOMAIN_COM-VRSN\nRegistrar WHOIS Server: whois.cloudflare.com\nRegistrar URL: http://www.cloudflare.com\nUpdated Date: 2024-01-15T10:20:30Z\nCreation Date: 2010-09-28T00:00:00Z\n...`,
		});
		setIsLoading(false);
        */
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
									const result = domainSchema.safeParse(value);

									if (!result.success) {
										// Extract the first error message from Zod and return it
										return result.error.issues[0].message;
									}

									return undefined;
								},
							}}
						>
							{(field) => (
								<>
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
											// disabled={isLoading}
										/>
									</div>
								</>
							)}

							{/* The error message returned from safeParse will show up here */}
						</domainLookUpForm.Field>
						<domainLookUpForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => {
								return (
									<Button
										type="submit"
										disabled={!canSubmit}
										className="bg-(--link) text-xs text-(--text) hover:bg-(--link)/80"
									>
										{isSubmitting ? "Scanning..." : "Lookup"}
									</Button>
								);
							}}
						</domainLookUpForm.Subscribe>
					</div>

					<div className="w-full">
						<domainLookUpForm.Field name="domainName">
							{(field) =>
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
	console.log("FAHHH", data);
	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard icon={<Globe />} title="Domain" value={data.domain} />
				<StatCard icon={<Shield />} title="Registrar" value={data.registrar} />
				<StatCard
					icon={<Calendar />}
					title="Registered On"
					value={new Date(data.creationDate).toLocaleDateString()}
				/>
				<StatCard
					icon={<Calendar />}
					title="Expires On"
					value={new Date(data.expirationDate).toLocaleDateString()}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className="bg-(--bg) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Server className="h-4 w-4 text-(--link)" />
							Name Servers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{Array.isArray(data?.nameServers) &&
								data.nameServers.map((ns) => (
									<li
										key={ns}
										className="font-mono text-xs text-(--text-secondary)"
									>
										{ns}
									</li>
								))}
						</ul>
					</CardContent>
				</Card>

				<Card className="bg-(--bg) border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Shield className="h-4 w-4 text-(--link)" />
							Domain Status
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{Array.isArray(data?.status) &&
								data.status.map((status) => (
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
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<FileText className="h-4 w-4 text-(--link)" />
						Raw WHOIS Data
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					<pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-(--text-secondary)">
						{data.rawText}
					</pre>
				</CardContent>
			</Card>
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
