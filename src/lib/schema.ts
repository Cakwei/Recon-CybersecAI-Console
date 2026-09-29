import { z } from "zod";

export const domainSchema = z
	.string()
	.trim() // Remove accidental whitespace
	.transform((val) => {
		// If the user didn't type http:// or https://, default to https://
		if (!/^https?:\/\//i.test(val)) {
			return `https://${val}`;
		}
		return val;
	})
	.pipe(
		// Validate the transformed string is actually a valid URL
		z.url({ message: "Invalid domain name" }),
	);
