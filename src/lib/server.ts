import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { axios } from "./axios";
import type { InternetDBResult } from "./types";

// InternetDB has no auth and no rate-limit key, but it does rate-limit by IP.
// Running the fetch server-side also avoids any CORS issues in the browser.

const inputSchema = z.object({
	ip: z.ipv4({ message: "Enter a valid IPv4 or IPv6 address" }),
});

export const lookupHost = createServerFn({ method: "GET" })
	.validator((data: unknown) => inputSchema.parse(data))
	.handler(async ({ data }): Promise<InternetDBResult> => {
		const response = await axios.get(`https://internetdb.shodan.io/${data.ip}`);

		if (response.status === 404) {
			throw new Error(
				"No data found for this host — it may not be indexed by Shodan.",
			);
		}

		if (!response) {
			throw new Error(
				`InternetDB returned an error, please try again in a moment.`,
			);
		}

		return response.data as InternetDBResult;
	});
