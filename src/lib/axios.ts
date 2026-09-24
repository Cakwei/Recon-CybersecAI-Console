import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import Axios from "axios";
import { auth } from "./auth";
import { logger } from "./logger";

export const getSessionFn = createServerFn().handler(async () => {
	const headers = { cookie: await getHeadersCookieFn() };
	const session = (await auth.api.getSession({
		headers: headers,
	})) as Awaited<ReturnType<typeof auth.api.getSession>>;
	return session;
});

export const getHeadersCookieFn = createServerFn().handler<Promise<string>>(
	async () => {
		const cookie = getRequestHeader("Cookie");
		logger.debug(`getHeadersCookie utils.ts @ ${cookie}`);
		return cookie || "";
	},
);

export function safeParseInt(str: string | null) {
	// 1. Convert to string and remove wrapping whitespace
	const cleanedStr = String(str || "").trim();

	// 2. Regex ensures the string is strictly digits, with no letters or symbols
	//    Also rejects negative signs (-) and decimal points (.)
	if (!/^\d+$/.test(cleanedStr)) {
		return 0;
	}

	// 3. Convert to a base-10 number
	const num = Number(cleanedStr);

	// 4. Reject 0 to ensure it is strictly positive (> 0)
	if (num === 0) {
		return 0;
	}
	logger.debug(`debug", "safeParseInt utils.ts @, ${num}`);
	return num;
}

export const axios = Axios.create({
	baseURL: "",
	...(typeof window === "undefined"
		? {
				headers: {
					cookie: await getHeadersCookieFn(),
				},
			}
		: { withCredentials: true }),
});
