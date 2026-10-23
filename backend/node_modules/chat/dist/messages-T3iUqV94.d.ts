import { A as Attachment, M as Message } from './types-kdVm1MWj.js';

/**
 * Content part types structurally identical to AI SDK's TextPart, ImagePart,
 * FilePart so that AiMessage[] is directly assignable to ModelMessage[].
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/model-message
 */
/** Matches AI SDK's DataContent */
type DataContent = string | Uint8Array | ArrayBuffer | Buffer;
interface AiTextPart {
    text: string;
    type: "text";
}
interface AiImagePart {
    image: DataContent | URL;
    mediaType?: string;
    type: "image";
}
interface AiFilePart {
    data: DataContent | URL;
    filename?: string;
    mediaType: string;
    type: "file";
}
type AiMessagePart = AiTextPart | AiImagePart | AiFilePart;
/**
 * A message formatted for AI SDK consumption.
 *
 * This is a discriminated union matching AI SDK's ModelMessage type:
 * - User messages can have text, image, and file parts
 * - Assistant messages have string content only
 */
type AiMessage = AiUserMessage | AiAssistantMessage;
interface AiUserMessage {
    content: string | AiMessagePart[];
    role: "user";
}
interface AiAssistantMessage {
    content: string;
    role: "assistant";
}
/**
 * Options for converting messages to AI SDK format.
 */
interface ToAiMessagesOptions {
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
     * @param aiMessage - The processed AI message
     * @param source - The original chat Message
     * @returns The message to include, or null to skip
     */
    transformMessage?: (aiMessage: AiMessage, source: Message) => AiMessage | null | Promise<AiMessage | null>;
}
/**
 * Convert chat SDK messages to AI SDK conversation format.
 *
 * - Keeps messages that have no text but carry content (images, files, links).
 *   Only messages with no usable content at all are skipped.
 * - Maps `author.isMe === true` to `"assistant"`, otherwise `"user"`
 * - Uses `message.text` for content
 * - Appends bounded link metadata inside an explicit untrusted-content fence
 * - Includes image attachments and text files as `FilePart`
 * - Uses `fetchData()` when available to include attachment data inline
 * - Warns on unsupported attachment types (video, audio)
 *
 * Works with `FetchResult.messages`, `thread.recentMessages`, or collected iterables.
 *
 * @example
 * ```typescript
 * const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
 * const history = await toAiMessages(result.messages);
 * const response = await agent.stream({ prompt: history });
 * ```
 */
declare function toAiMessages(messages: Message[], options?: ToAiMessagesOptions): Promise<AiMessage[]>;

export { type AiAssistantMessage as A, type ToAiMessagesOptions as T, type AiFilePart as a, type AiImagePart as b, type AiMessage as c, type AiMessagePart as d, type AiTextPart as e, type AiUserMessage as f, toAiMessages as t };
