import { RateLimiter } from "@tanstack/pacer";
import { describe, expect, it, vi } from "vitest";

describe("rate limiter (TanStack Pacer)", () => {
	it("should allow calls up to the limit within sliding window", () => {
		const onExecute = vi.fn();
		const onReject = vi.fn();

		const limiter = new RateLimiter(
			(data: string) => {
				onExecute(data);
			},
			{
				limit: 3,
				window: 1000,
				windowType: "sliding",
				onReject,
			},
		);

		limiter.maybeExecute("call-1");
		limiter.maybeExecute("call-2");
		limiter.maybeExecute("call-3");

		expect(onExecute).toHaveBeenCalledTimes(3);
		expect(onReject).not.toHaveBeenCalled();
		expect(limiter.getRemainingInWindow()).toBe(0);
	});

	it("should reject calls exceeding the limit and trigger onReject", () => {
		const onExecute = vi.fn();
		const onReject = vi.fn();

		const limiter = new RateLimiter(
			(val: number) => {
				onExecute(val);
			},
			{
				limit: 2,
				window: 1000,
				windowType: "sliding",
				onReject,
			},
		);

		limiter.maybeExecute(1);
		limiter.maybeExecute(2);
		limiter.maybeExecute(3); // Exceeds limit

		expect(onExecute).toHaveBeenCalledTimes(2);
		expect(onReject).toHaveBeenCalledTimes(1);
	});
});
