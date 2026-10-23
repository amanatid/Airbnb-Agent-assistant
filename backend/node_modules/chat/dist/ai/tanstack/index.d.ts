import { a as ChatToolsBaseOptions, b as ChatToolName } from '../../toolset-CW8wvCqU.js';
export { A as ApprovalConfig, e as ChatApprovalToolName, C as ChatBinding, f as ChatToolPreset, g as ChatWriteToolName, R as ReadScope } from '../../toolset-CW8wvCqU.js';
import { A as Attachment, M as Message } from '../../types-kdVm1MWj.js';
import { ZodType } from 'zod';
import '../../chat-CCrOm5ZQ.js';
import '../../jsx-runtime-bmw6xUDW.js';
import 'mdast';
import '@workflow/serde';

/**
 * Content part types structurally compatible with TanStack AI's TextPart and
 * ImagePart so that TanStackMessage[] is directly assignable to ModelMessage[].
 * Declared locally so this module has no runtime dependency on @tanstack/ai.
 * @see https://github.com/TanStack/ai/blob/main/packages/ai/src/types.ts
 */
interface TanStackTextPart {
    content: string;
    type: "text";
}
interface TanStackImagePart {
    source: {
        mimeType: string;
        type: "data";
        /** Base64-encoded bytes with no `data:` URL prefix */
        value: string;
    };
    type: "image";
}
type TanStackContentPart = TanStackTextPart | TanStackImagePart;
/**
 * A message formatted for TanStack AI consumption.
 *
 * This is a discriminated union matching TanStack AI's ModelMessage type:
 * - User messages can have text and image parts
 * - Assistant messages have string content only
 */
type TanStackMessage = TanStackUserMessage | TanStackAssistantMessage;
interface TanStackUserMessage {
    content: string | TanStackContentPart[];
    role: "user";
}
interface TanStackAssistantMessage {
    content: string;
    role: "assistant";
}
/**
 * Options for converting messages to TanStack AI format.
 */
interface ToTanStackMessagesOptions {
    /** When true, prefixes user messages with "[username]: " for multi-user context */
    includeNames?: boolean;
    /**
     * Called when an attachment type is not supported (video, audio).
     * Defaults to `console.warn`.
     */
    onUnsupportedAttachment?: (attachment: Attachment, message: Message) => void;
    /**
     * Called for each message after default processing (text, links, attachments).
     * Return the message (modified or as-is) to include it, or `null` to skip it.
     *
     * @param tanStackMessage - The processed TanStack AI message
     * @param source - The original chat Message
     * @returns The message to include, or null to skip
     */
    transformMessage?: (tanStackMessage: TanStackMessage, source: Message) => TanStackMessage | null | Promise<TanStackMessage | null>;
}
/**
 * Convert chat SDK messages to TanStack AI conversation format.
 *
 * - Keeps messages that have no text but carry content (images, files, links).
 *   Only messages with no usable content at all are skipped.
 * - Maps `author.isMe === true` to `"assistant"`, otherwise `"user"`
 * - Uses `message.text` for content
 * - Appends bounded link metadata inside an explicit untrusted-content fence
 * - Includes image attachments as base64 `ImagePart`s
 * - Inlines text file attachments into the message text as
 *   `[File: name (mime)]` blocks, since TanStack AI has no file content part
 * - Uses `fetchData()` when available to include attachment data inline
 * - Warns on unsupported attachment types (video, audio)
 *
 * TanStack AI has no system role on `ModelMessage`; pass system prompts via
 * `chat({ systemPrompts })` instead.
 *
 * Works with `FetchResult.messages`, `thread.recentMessages`, or collected iterables.
 *
 * @example
 * ```typescript
 * import { chat } from "@tanstack/ai";
 *
 * const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
 * const stream = chat({
 *   adapter,
 *   systemPrompts: ["You are a helpful assistant."],
 *   messages: await toTanStackMessages(result.messages),
 * });
 * ```
 */
declare function toTanStackMessages(messages: Message[], options?: ToTanStackMessagesOptions): Promise<TanStackMessage[]>;

/**
 * A Chat SDK tool shaped for TanStack AI's `chat({ tools })`.
 *
 * Structurally compatible with `Tool` / `AnyTool` from `@tanstack/ai`, so the
 * array returned by {@link createTanStackTools} can be passed to `chat()`
 * directly. Declared locally so `chat/ai/tanstack` has no runtime dependency
 * on `@tanstack/ai`.
 */
interface TanStackTool<TInput = unknown, TOutput = unknown> {
    description: string;
    execute(args: TInput, context?: unknown): Promise<TOutput>;
    inputSchema: ZodType<TInput>;
    lazy?: boolean;
    metadata?: Record<string, unknown>;
    name: string;
    needsApproval?: boolean;
}
/**
 * Per-tool overrides for TanStack AI tools. `name`, `inputSchema`,
 * `outputSchema`, and `execute` are intentionally excluded so tool semantics
 * stay stable.
 */
type TanStackToolOverrides = Partial<Pick<TanStackTool, "description" | "lazy" | "metadata" | "needsApproval">>;
interface TanStackChatToolsOptions extends ChatToolsBaseOptions {
    /**
     * Per-tool overrides for customizing tool behavior (description,
     * needsApproval, metadata, lazy) without changing the underlying
     * implementation. Core tool fields cannot be overridden.
     *
     * @example
     * ```ts
     * createTanStackTools({
     *   chat,
     *   overrides: {
     *     deleteMessage: { needsApproval: false },
     *     postMessage: { description: 'Reply in the active support thread.' },
     *   },
     * })
     * ```
     */
    overrides?: Partial<Record<ChatToolName, TanStackToolOverrides>>;
}
/**
 * Create a set of Chat SDK tools for TanStack AI.
 *
 * Returns plain tool objects accepted by `chat({ tools })` from
 * `@tanstack/ai`, with the same tools, presets, approval flags, scope guard,
 * and override rules as `createChatTools` from `chat/ai`.
 *
 * Requires zod 4.2 or newer for the input schemas. `needsApproval: true`
 * makes TanStack pause the run with a tool-approval interrupt; a server-side
 * bot has to resume that run itself (see the TanStack AI docs on tool
 * approval), so most bots pass `requireApproval: false` or handle approval
 * before calling `chat()`.
 *
 * @example
 * ```ts
 * import { chat } from '@tanstack/ai'
 * import { vercelGatewayText } from '@tanstack/ai-vercel-gateway'
 * import { createTanStackTools, toTanStackMessages } from 'chat/ai/tanstack'
 *
 * bot.onNewMention(async (thread, message) => {
 *   const history = await thread.adapter.fetchMessages(thread.id, { limit: 20 })
 *   const stream = chat({
 *     adapter: vercelGatewayText('anthropic/claude-opus-5'),
 *     systemPrompts: ['You are a helpful assistant.'],
 *     messages: await toTanStackMessages(history.messages),
 *     tools: createTanStackTools({ chat: bot, preset: 'messenger', requireApproval: false }),
 *   })
 *   await thread.post(stream)
 * })
 * ```
 */
declare function createTanStackTools({ overrides, preset, ...base }: TanStackChatToolsOptions): TanStackTool[];

export { ChatToolName, type TanStackAssistantMessage, type TanStackChatToolsOptions, type TanStackContentPart, type TanStackImagePart, type TanStackMessage, type TanStackTextPart, type TanStackTool, type TanStackToolOverrides, type TanStackUserMessage, type ToTanStackMessagesOptions, createTanStackTools, toTanStackMessages };
