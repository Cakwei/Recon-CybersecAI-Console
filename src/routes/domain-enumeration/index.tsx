import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/domain-enumeration/")({
	beforeLoad: () => {
		throw redirect({ to: "/subdomains" });
	},
});

