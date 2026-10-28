import { useForm } from "@tanstack/react-form";
import {
	AlertTriangle,
	Bot,
	Check,
	Copy,
	CornerDownLeft,
	Flame,
	RefreshCw,
	Square,
	Terminal,
	User,
	Zap,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import type { AiProvider, StreamChatInput } from "#/lib/ai-analyst.ts";
import { useFormRateLimiter } from "#/lib/use-rate-limiter.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	provider?: "anthropic" | "gemini" | "heuristic";
	timestamp: string;
}

export function normalizeFrontierText(content: string): string {
	if (!content) return "";
	return (
		content
			// Strip alert tags like [!IMPORTANT], [!NOTE], etc. without consuming linebreaks
			.replace(/\[!(?:IMPORTANT|NOTE|WARNING|TIP|CAUTION)\][^\S\r\n]*/gi, "")
			// Strip any leading blockquote markers (> or multiple > >) at start of lines
			.replace(/^(?:[ \t]*>[ \t]*)+"?/gm, "")
			// Strip any trailing quotation mark from a wrapped quote
			.replace(/"[ \t]*$/gm, "")
			// Clean up leading/trailing empty lines
			.trim()
	);
}

interface CyberChatProps {
	target?: string;
	dossierContext?: StreamChatInput["dossierContext"];
	initialAnalysis?: string;
	selectedProvider: AiProvider;
	onSelectProvider: (provider: AiProvider) => void;
	className?: string;
}

const PRESET_PROMPTS = [
	{
		label: "🛡️ Remediation Plan",
		prompt:
			"Generate a prioritized step-by-step 30-day remediation roadmap for this target.",
	},
	{
		label: "🚫 UFW Firewall Rules",
		prompt:
			"Generate production UFW and iptables firewall rules for our discovered open ports.",
	},
	{
		label: "🪲 Patch CVEs",
		prompt:
			"How do I patch and mitigate the specific CVEs cataloged on this host?",
	},
	{
		label: "📧 SPF & DMARC DNS",
		prompt:
			"Provide exact authoritative DNS TXT records for SPF, DMARC, and CAA protection.",
	},
	{
		label: "🔒 Nginx TLS Hardening",
		prompt:
			"Provide hardened Nginx configuration enforcing TLS 1.3 and security headers.",
	},
];

export function CyberChat({
	target = "Audited Target",
	dossierContext,
	initialAnalysis,
	selectedProvider,
	onSelectProvider,
	className = "",
}: CyberChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>(() => {
		if (initialAnalysis) {
			return [
				{
					id: "msg-init",
					role: "assistant",
					content: initialAnalysis,
					provider: "heuristic",
					timestamp: new Date().toISOString(),
				},
			];
		}
		return [
			{
				id: "msg-welcome",
				role: "assistant",
				content: `### 🛡️ Antigravity AI Security Analyst Ready

I have ingested the external perimeter attack surface intelligence for **\`${target}\`**.
- **Overall Grade:** **${dossierContext?.grade ?? "Pending"}** (${dossierContext?.score ?? 0}/100)
- **Open Ports:** ${dossierContext?.openPorts?.length ? dossierContext.openPorts.join(", ") : "None cataloged"}
- **Identified Findings:** ${dossierContext?.risks?.length ?? 0} observation(s)

Choose one of the quick mitigation actions below or ask any tactical question about securing this infrastructure.`,
				provider: "heuristic",
				timestamp: new Date().toISOString(),
			},
		];
	});

	const [isStreaming, setIsStreaming] = useState(false);
	const [streamError, setStreamError] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// TanStack Pacer Rate Limiting
	const { rateLimitError, executeWithRateLimit, isExceeded } =
		useFormRateLimiter({
			limit: 6,
			windowMs: 15000,
			name: "AI Security Chat",
		});

	useEffect(() => {
		if (messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length]);

	// Send message handler
	const handleSendMessage = async (textToSend: string) => {
		const cleanPrompt = textToSend.trim();
		if (!cleanPrompt || isStreaming) return;

		setStreamError(null);

		const userMsg: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: cleanPrompt,
			timestamp: new Date().toISOString(),
		};

		const assistantMsgId = `assistant-${Date.now()}`;
		const assistantMsg: ChatMessage = {
			id: assistantMsgId,
			role: "assistant",
			content: "",
			provider: selectedProvider === "auto" ? "heuristic" : selectedProvider,
			timestamp: new Date().toISOString(),
		};

		const updatedMessages = [...messages, userMsg];
		setMessages([...updatedMessages, assistantMsg]);
		setIsStreaming(true);

		const controller = new AbortController();
		abortControllerRef.current = controller;

		try {
			const response = await fetch("/api/v1/ai/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				signal: controller.signal,
				body: JSON.stringify({
					messages: updatedMessages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
					target,
					dossierContext,
					provider: selectedProvider,
				}),
			});

			if (!response.ok) {
				const errorJson = await response.json().catch(() => ({}));
				throw new Error(
					errorJson.error ||
						`Chat server returned status ${response.status} (${response.statusText})`,
				);
			}

			if (!response.body) {
				throw new Error("No response body received from chat stream.");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let accumulated = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				accumulated += chunk;

				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMsgId ? { ...m, content: accumulated } : m,
					),
				);
			}
		} catch (err: unknown) {
			if (err instanceof Error && err.name === "AbortError") {
				// User manually aborted stream
				return;
			}
			const message =
				err instanceof Error ? err.message : "Failed to stream AI response.";
			setStreamError(message);
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantMsgId
						? {
								...m,
								content:
									m.content.trim().length > 0
										? m.content
										: `⚠️ **Security Analyst Unavailable:** ${message}`,
							}
						: m,
				),
			);
		} finally {
			setIsStreaming(false);
			abortControllerRef.current = null;
		}
	};

	const handleStopGeneration = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			setIsStreaming(false);
		}
	};

	const handleCopy = (content: string, id: string) => {
		navigator.clipboard.writeText(content);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleResetChat = () => {
		handleStopGeneration();
		setMessages([
			{
				id: `reset-${Date.now()}`,
				role: "assistant",
				content: `### 🛡️ Antigravity AI Security Analyst Ready

Conversation reset. I am ready with full attack surface context for **\`${target}\`**. Ask me anything!`,
				provider: "heuristic",
				timestamp: new Date().toISOString(),
			},
		]);
	};

	// TanStack Form Setup
	const chatForm = useForm({
		defaultValues: {
			prompt: "",
		},
		onSubmit: async ({ value }) => {
			const prompt = value.prompt;
			chatForm.reset();
			await handleSendMessage(prompt);
		},
	});

	const onFormSubmit = (e: FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		executeWithRateLimit(() => {
			chatForm.handleSubmit();
		});
	};

	return (
		<div
			className={`flex flex-col rounded-xl border border-purple-500/30 bg-(--bg-secondary) overflow-hidden shadow-xl ${className}`}
		>
			{/* Chat Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-purple-500/20 bg-purple-950/20">
				<div className="flex items-center gap-3">
					<div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
						<Bot className="h-4 w-4" />
						{isStreaming && (
							<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
							</span>
						)}
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-sm text-(--text)">
								AI Security Analyst Chat
							</h3>
							<Badge
								variant="outline"
								className="text-[10px] font-mono border-purple-500/40 text-purple-300"
							>
								{isStreaming ? (
									<span className="flex items-center gap-1 text-purple-400 font-medium">
										<Zap className="h-3 w-3 animate-spin" /> Streaming
									</span>
								) : (
									"Live"
								)}
							</Badge>
						</div>
						<p className="text-[11px] text-(--text-secondary) font-mono">
							Target: <span className="text-(--text)">{target}</span>
							{dossierContext?.grade && (
								<span className="ml-2 text-purple-300">
									(Grade {dossierContext.grade} · {dossierContext.score}/100)
								</span>
							)}
						</p>
					</div>
				</div>

				{/* Provider Selector and Actions */}
				<div className="flex items-center gap-2 self-end sm:self-center">
					<div className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-(--bg)/80 p-0.5">
						<button
							type="button"
							onClick={() => onSelectProvider("auto")}
							disabled={isStreaming}
							className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
								selectedProvider === "auto"
									? "bg-purple-900/60 text-purple-200 font-semibold"
									: "text-(--text-secondary) hover:text-(--text)"
							}`}
							title="Auto-detect active API key (Claude -> Gemini -> Heuristic)"
						>
							Auto
						</button>
						<button
							type="button"
							onClick={() => onSelectProvider("anthropic")}
							disabled={isStreaming}
							className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors flex items-center gap-1 ${
								selectedProvider === "anthropic"
									? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
									: "text-(--text-secondary) hover:text-(--text)"
							}`}
							title="Use Anthropic Claude 3.5 Sonnet"
						>
							<span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
							Anthropic
						</button>
						<button
							type="button"
							onClick={() => onSelectProvider("gemini")}
							disabled={isStreaming}
							className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors flex items-center gap-1 ${
								selectedProvider === "gemini"
									? "bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30"
									: "text-(--text-secondary) hover:text-(--text)"
							}`}
							title="Use Google Gemini 2.5 Flash"
						>
							<span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
							Gemini
						</button>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleResetChat}
						disabled={isStreaming}
						className="h-7 px-2 text-xs text-(--text-secondary) hover:text-(--text)"
						title="Reset conversation"
					>
						<RefreshCw className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{/* Stream Error Alert */}
			{streamError && (
				<Alert className="mx-4 mt-3 border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>{streamError}</AlertDescription>
				</Alert>
			)}

			{/* Rate Limit Alert */}
			{rateLimitError && (
				<Alert className="mx-4 mt-3 border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>{rateLimitError}</AlertDescription>
				</Alert>
			)}

			{/* Message Feed */}
			<div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[600px] min-h-[320px]">
				{messages.map((message, index) => {
					const isUser = message.role === "user";
					const isLatest = index === messages.length - 1;
					const isCurrentlyStreaming = isStreaming && isLatest && !isUser;

					return (
						<div
							key={message.id}
							className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
						>
							{/* Avatar */}
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-mono ${
									isUser
										? "border-(--link)/40 bg-(--link)/10 text-(--link)"
										: "border-purple-500/30 bg-purple-950/40 text-purple-300"
								}`}
							>
								{isUser ? (
									<User className="h-4 w-4" />
								) : (
									<Bot className="h-4 w-4" />
								)}
							</div>

							{/* Message Bubble */}
							<div
								className={`group relative max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
									isUser
										? "bg-(--link)/15 text-(--text) border border-(--link)/30 rounded-tr-none"
										: "bg-(--bg)/90 text-(--text) border border-purple-500/20 rounded-tl-none"
								}`}
							>
								{/* Header details */}
								<div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-border/40">
									<div className="flex items-center gap-1.5">
										<span className="font-semibold text-[11px] text-(--text)">
											{isUser ? "You" : "Antigravity Analyst"}
										</span>
										{!isUser && (
											<Badge
												variant="secondary"
												className="text-[9px] font-mono px-1 py-0 bg-purple-950/50 text-purple-300 border-purple-500/20"
											>
												{selectedProvider === "anthropic"
													? "Claude 3.5 Sonnet"
													: selectedProvider === "gemini"
														? "Gemini 3.5 Flash Lite"
														: "Heuristic AI"}
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] font-mono text-(--text-secondary)">
											{new Date(message.timestamp).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
										{!isUser && message.content && (
											<button
												type="button"
												onClick={() =>
													handleCopy(
														normalizeFrontierText(message.content),
														message.id,
													)
												}
												className="text-(--text-secondary) hover:text-(--text) transition-colors ml-1 p-0.5 rounded"
												title="Copy markdown"
											>
												{copiedId === message.id ? (
													<Check className="h-3 w-3 text-emerald-400" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</button>
										)}
									</div>
								</div>

								{/* Message Content */}
								{isUser ? (
									<div className="whitespace-pre-wrap">{message.content}</div>
								) : (
									<div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed break-words overflow-x-auto">
										{message.content ? (
											<Streamdown
												mode={isCurrentlyStreaming ? "streaming" : "static"}
												className="[&_blockquote]:not-italic [&_blockquote]:border-l-0 [&_blockquote]:pl-0 [&_blockquote]:my-0 [&_blockquote]:font-normal [&_blockquote_p:first-of-type::before]:content-none [&_blockquote_p:last-of-type::after]:content-none [&_pre]:bg-neutral-950 [&_pre]:border [&_pre]:border-border [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border [&_th]:p-2 [&_td]:p-2 [&_a]:text-purple-400 [&_a]:underline"
											>
												{normalizeFrontierText(message.content)}
											</Streamdown>
										) : (
											<div className="flex items-center gap-2 py-2 text-xs text-purple-300 font-mono">
												<Terminal className="h-4 w-4 animate-spin text-purple-400" />
												Analyzing attack surface and synthesizing response…
											</div>
										)}
										{isCurrentlyStreaming && (
											<span className="inline-block w-2 h-3.5 ml-1 bg-purple-400 animate-pulse rounded-xs align-middle" />
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{/* Quick Preset Pills */}
			<div className="px-4 py-2 border-t border-purple-500/20 bg-(--bg)/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
				<span className="text-[10px] uppercase font-mono tracking-wider text-(--text-secondary) shrink-0 flex items-center gap-1">
					<Flame className="h-3 w-3 text-purple-400" /> Presets:
				</span>
				{PRESET_PROMPTS.map((preset) => (
					<button
						key={preset.label}
						type="button"
						disabled={isStreaming}
						onClick={() => {
							executeWithRateLimit(() => {
								handleSendMessage(preset.prompt);
							});
						}}
						className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{preset.label}
					</button>
				))}
			</div>

			{/* Chat Input Bar */}
			<div className="p-3 sm:p-4 border-t border-purple-500/20 bg-(--bg-secondary)">
				<form onSubmit={onFormSubmit} className="relative flex flex-col gap-2">
					<chatForm.Field
						name="prompt"
						validators={{
							onChange: ({ value }) =>
								!value || value.trim().length === 0
									? "Please enter a message"
									: undefined,
						}}
					>
						{(field) => {
							const hasValue = Boolean(field.state.value?.trim());

							return (
								<div className="relative flex items-center rounded-lg border border-purple-500/30 bg-(--bg) focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20">
									<textarea
										ref={textareaRef}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												if (hasValue && !isStreaming && !isExceeded) {
													onFormSubmit(e);
												}
											}
										}}
										placeholder={`Ask anything about ${target} perimeter, hardening, or CVEs… (Enter to send)`}
										disabled={isStreaming}
										rows={2}
										className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-(--text) placeholder:text-(--text-secondary) outline-none disabled:opacity-50"
									/>

									<div className="flex items-center gap-2 pr-3 shrink-0">
										{isStreaming ? (
											<Button
												type="button"
												size="sm"
												variant="destructive"
												onClick={handleStopGeneration}
												className="h-8 px-2.5 text-xs bg-rose-600 hover:bg-rose-500 font-mono flex items-center gap-1"
											>
												<Square className="h-3 w-3 fill-current" /> Stop
											</Button>
										) : (
											<Button
												type="submit"
												size="sm"
												disabled={!hasValue || isStreaming || isExceeded}
												className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
											>
												<span>Send</span>
												<CornerDownLeft className="h-3 w-3" />
											</Button>
										)}
									</div>
								</div>
							);
						}}
					</chatForm.Field>

					<div className="flex items-center justify-between text-[11px] text-(--text-secondary) px-1 font-mono">
						<span>Press Enter to send, Shift+Enter for new line</span>
						<span>
							Rate Limit: {isExceeded ? "Exceeded" : "Active (6 / 15s)"}
						</span>
					</div>
				</form>
			</div>
		</div>
	);
}
