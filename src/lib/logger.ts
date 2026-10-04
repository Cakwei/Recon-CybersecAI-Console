import pino from "pino";

export const logger = pino({
	level: import.meta.env.DEV ? "debug" : "info",
});
