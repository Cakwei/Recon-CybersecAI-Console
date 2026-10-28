import axios, { type AxiosError } from "axios";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { IWhoIs } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function fetchWhoIsInfo({ domainName }: IWhoIs) {
	try {
		const httpRegex = /^https?:\/\//i;
		const domain = httpRegex.test(domainName)
			? domainName.split("https://")[1]
			: domainName;

		const response = await axios.get("https://whoisjson.com/api/v1/whois", {
			params: { domain },
			headers: { Authorization: `TOKEN=${process.env.WHOIS_API_KEY}` },
		});

		// logger.debug(response.data);
		return response.data;
	} catch (error) {
		console.error("Error fetching WHOIS data:", (error as AxiosError).message);
	}
}
