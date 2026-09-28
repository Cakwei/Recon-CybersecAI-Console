import type { ReactNode } from "react";

export type ReactProps = { children: ReactNode; className: string };

export interface InternetDBResult {
	ip: string;
	ports: number[];
	hostnames: string[];
	cpes: string[];
	tags: string[];
	vulns: string[];
}

export type IWhoIs = {
	domainName: string;
};
