import { useRateLimiter } from "@tanstack/react-pacer";
import { useCallback, useState } from "react";

export interface RateLimiterHookOptions {
	/** Maximum requests allowed in the window (default: 5) */
	limit?: number;
	/** Window duration in milliseconds (default: 10000ms / 10s) */
	windowMs?: number;
	/** Friendly name for the action in error messages (e.g., "Scan", "Audit", "Lookup") */
	name?: string;
}

/**
 * Reusable client-side rate limiting hook powered by TanStack Pacer.
 * Enforces a sliding window rate limit on form submissions and actions.
 */
export function useFormRateLimiter(options?: RateLimiterHookOptions) {
	const limit = options?.limit ?? 5;
	const windowMs = options?.windowMs ?? 10000;
	const name = options?.name ?? "Search";

	const [rateLimitError, setRateLimitError] = useState<string | null>(null);

	const rateLimiter = useRateLimiter(
		(callback: () => void | Promise<void>) => {
			setRateLimitError(null);
			return callback();
		},
		{
			limit,
			window: windowMs,
			windowType: "sliding",
			onReject: () => {
				const seconds = Math.round(windowMs / 1000);
				setRateLimitError(
					`Rate limit reached: Maximum ${limit} ${name.toLowerCase()} requests per ${seconds}s. Please wait a moment before trying again.`,
				);
			},
		},
		(state) => ({
			isExceeded: state.isExceeded,
			rejectionCount: state.rejectionCount,
			executionCount: state.executionCount,
		}),
	);

	const executeWithRateLimit = useCallback(
		(callback: () => void | Promise<void>) => {
			rateLimiter.maybeExecute(callback);
		},
		[rateLimiter],
	);

	const clearRateLimitError = useCallback(() => {
		setRateLimitError(null);
	}, []);

	return {
		rateLimiter,
		rateLimitError,
		clearRateLimitError,
		executeWithRateLimit,
		isExceeded: Boolean(rateLimiter.state?.isExceeded),
		remaining: rateLimiter.getRemainingInWindow(),
	};
}
