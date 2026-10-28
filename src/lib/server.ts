import { createServerFn } from "@tanstack/react-start";
import axios from "axios";
import { z } from "zod";
import type { InternetDBResult } from "./types";

export async function fetchShodanHost(ip: string): Promise<InternetDBResult> {
	const response = await axios.get(`https://internetdb.shodan.io/${ip}`, {
		timeout: 10000,
	});

	if (response.status === 404) {
		throw new Error(
			"No data found for this host — it may not be indexed by Shodan.",
		);
	}

	if (!response.data) {
		throw new Error(
			"InternetDB returned an error, please try again in a moment.",
		);
	}

	return response.data as InternetDBResult;
}

const inputSchema = z.object({
	ip: z.ipv4({ message: "Enter a valid IPv4 address" }),
});

export const lookupHost = createServerFn({ method: "GET" })
	.validator((data: unknown) => inputSchema.parse(data))
	.handler(async ({ data }): Promise<InternetDBResult> => {
		return await fetchShodanHost(data.ip);
	});
