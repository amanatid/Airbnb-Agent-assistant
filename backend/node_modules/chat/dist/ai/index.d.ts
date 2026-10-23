import { Tool } from 'ai';
import { a0 as ChannelVisibility } from '../types-kdVm1MWj.js';
import { C as ChatBinding, T as ToolOptions, S as ScopeGuard, a as ChatToolsBaseOptions, b as ChatToolName, c as ChatToolSpec, d as ChatToolSpecFactories } from '../toolset-CW8wvCqU.js';
export { A as ApprovalConfig, e as ChatApprovalToolName, f as ChatToolPreset, g as ChatWriteToolName, R as ReadScope } from '../toolset-CW8wvCqU.js';
export { A as AiAssistantMessage, a as AiFilePart, b as AiImagePart, c as AiMessage, d as AiMessagePart, e as AiTextPart, f as AiUserMessage, T as ToAiMessagesOptions, t as toAiMessages } from '../messages-T3iUqV94.js';
import '../jsx-runtime-bmw6xUDW.js';
import 'mdast';
import '@workflow/serde';
import 'zod';
import '../chat-CCrOm5ZQ.js';

/**
 * Per-tool overrides for customizing tool behavior without changing the
 * underlying implementation. `execute`, `inputSchema`, and `outputSchema`
 * are intentionally excluded so tool semantics stay stable.
 */
type ToolOverrides = Partial<Pick<Tool, "description" | "inputExamples" | "metadata" | "needsApproval" | "onInputAvailable" | "onInputDelta" | "onInputStart" | "providerOptions" | "strict" | "title" | "toModelOutput">>;
declare const fetchMessages: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    threadId: string;
    limit: number;
    direction: "forward" | "backward";
    cursor?: string | undefined;
}, {
    messages: {
        id: string;
        threadId: string;
        text: string;
        author: {
            userId: string;
            userName: string;
            fullName: string;
            isBot: boolean | "unknown";
            isMe: boolean;
        };
        dateSent: string;
        edited: boolean;
        isMention: boolean | undefined;
        attachments: {
            type: "image" | "file" | "video" | "audio";
            name: string | undefined;
            mimeType: string | undefined;
            url: string | undefined;
        }[];
    }[];
    nextCursor: string | undefined;
}>;
declare const fetchChannelMessages: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    channelId: string;
    limit: number;
    direction: "forward" | "backward";
    cursor?: string | undefined;
}, {
    messages: {
        id: string;
        threadId: string;
        text: string;
        author: {
            userId: string;
            userName: string;
            fullName: string;
            isBot: boolean | "unknown";
            isMe: boolean;
        };
        dateSent: string;
        edited: boolean;
        isMention: boolean | undefined;
        attachments: {
            type: "image" | "file" | "video" | "audio";
            name: string | undefined;
            mimeType: string | undefined;
            url: string | undefined;
        }[];
    }[];
    nextCursor: string | undefined;
}>;
declare const fetchThread: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    threadId: string;
}, {
    id: string;
    channelId: string;
    channelName: string | undefined;
    channelVisibility: ChannelVisibility | undefined;
    isDM: boolean;
}>;
declare const listThreads: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    channelId: string;
    limit: number;
    cursor?: string | undefined;
}, {
    threads: {
        id: string;
        replyCount: number | undefined;
        lastReplyAt: string | undefined;
        rootMessage: {
            id: string;
            threadId: string;
            text: string;
            author: {
                userId: string;
                userName: string;
                fullName: string;
                isBot: boolean | "unknown";
                isMe: boolean;
            };
            dateSent: string;
            edited: boolean;
            isMention: boolean | undefined;
            attachments: {
                type: "image" | "file" | "video" | "audio";
                name: string | undefined;
                mimeType: string | undefined;
                url: string | undefined;
            }[];
        };
    }[];
    nextCursor: string | undefined;
}>;
declare const getThreadParticipants: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    threadId: string;
}, {
    participants: {
        userId: string;
        userName: string;
        fullName: string;
        isBot: boolean | "unknown";
    }[];
}>;
declare const getChannelInfo: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    channelId: string;
}, {
    id: string;
    name: string | undefined;
    isDM: boolean;
    memberCount: number | undefined;
    channelVisibility: ChannelVisibility | undefined;
}>;
declare const getUser: (chat: ChatBinding, needsApproval?: boolean) => Tool<{
    userId: string;
}, {
    userId: string;
    userName: string;
    fullName: string;
    email: string | undefined;
    isBot: boolean;
    avatarUrl: string | undefined;
} | null>;
declare const startTyping: (chat: ChatBinding, guard?: ScopeGuard) => Tool<{
    threadId: string;
    status?: string | undefined;
}, {
    typing: boolean;
    threadId: string;
}>;
declare const postMessage: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
    message: string | {
        markdown: string;
    } | {
        raw: string;
    };
}, {
    messageId: string;
    threadId: string;
}>;
declare const postChannelMessage: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    channelId: string;
    message: string | {
        markdown: string;
    } | {
        raw: string;
    };
}, {
    messageId: string;
    threadId: string;
}>;
declare const sendDirectMessage: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    userId: string;
    message: string | {
        markdown: string;
    } | {
        raw: string;
    };
}, {
    messageId: string;
    threadId: string;
}>;
declare const editMessage: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
    messageId: string;
    message: string | {
        markdown: string;
    } | {
        raw: string;
    };
}, {
    messageId: string;
    threadId: string;
}>;
declare const deleteMessage: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
    messageId: string;
}, {
    deleted: boolean;
    messageId: string;
    threadId: string;
}>;
declare const addReaction: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
    messageId: string;
    emoji: string;
}, {
    added: boolean;
    emoji: string;
    messageId: string;
    threadId: string;
}>;
declare const removeReaction: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
    messageId: string;
    emoji: string;
}, {
    removed: boolean;
    emoji: string;
    messageId: string;
    threadId: string;
}>;
declare const subscribeThread: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
}, {
    subscribed: boolean;
    threadId: string;
}>;
declare const unsubscribeThread: (chat: ChatBinding, options?: ToolOptions) => Tool<{
    threadId: string;
}, {
    subscribed: boolean;
    threadId: string;
}>;

interface ChatToolsOptions extends ChatToolsBaseOptions {
    /**
     * Per-tool overrides for customizing tool behavior (description, title,
     * needsApproval, etc.) without changing the underlying implementation.
     * Core tool fields cannot be overridden.
     *
     * @example
     * ```ts
     * createChatTools({
     *   chat,
     *   overrides: {
     *     deleteMessage: { needsApproval: false },
     *     postMessage: { description: 'Reply in the active support thread.' },
     *   },
     * })
     * ```
     */
    overrides?: Partial<Record<ChatToolName, ToolOverrides>>;
}
type AiToolOf<TSpec> = TSpec extends ChatToolSpec<infer TInput, infer TOutput> ? Tool<TInput, TOutput> : never;
type ChatToolMap = {
    [K in ChatToolName]: AiToolOf<ReturnType<ChatToolSpecFactories[K]>>;
};
/**
 * Create a set of Chat SDK tools for the Vercel AI SDK.
 *
 * Lets an AI agent operate inside a workspace: read messages, post replies,
 * send DMs, react, edit, delete, and manage thread subscriptions across
 * every adapter the supplied {@link ChatBinding} has registered.
 *
 * Write operations and arbitrary user profile lookups require approval by
 * default. Control this globally or per-tool via `requireApproval`. Use
 * `preset` to scope the toolset.
 *
 * Using TanStack AI instead? Import `createTanStackTools` from
 * `chat/ai/tanstack`; it exposes the same tools, options, and presets.
 *
 * @example
 * ```ts
 * import { Chat } from 'chat'
 * import { createChatTools } from 'chat/ai'
 * import { generateText } from 'ai'
 *
 * const chat = new Chat({ ... })
 *
 * const result = await generateText({
 *   model: yourModel,
 *   tools: createChatTools({ chat, preset: 'messenger' }),
 *   prompt: 'Reply in thread slack:C123:1234.5678 with the daily summary.',
 * })
 * ```
 *
 * @example Granular approval
 * ```ts
 * createChatTools({
 *   chat,
 *   preset: 'moderator',
 *   requireApproval: {
 *     deleteMessage: true,
 *     editMessage: true,
 *     postMessage: false,
 *     addReaction: false,
 *   },
 * })
 * ```
 */
declare function createChatTools({ overrides, preset, ...base }: ChatToolsOptions): Partial<ChatToolMap>;
/** The shape of the object returned by {@link createChatTools}. */
type ChatTools = ReturnType<typeof createChatTools>;

export { ChatBinding, ChatToolName, type ChatTools, type ChatToolsOptions, ToolOptions, type ToolOverrides, addReaction, createChatTools, deleteMessage, editMessage, fetchChannelMessages, fetchMessages, fetchThread, getChannelInfo, getThreadParticipants, getUser, listThreads, postChannelMessage, postMessage, removeReaction, sendDirectMessage, startTyping, subscribeThread, unsubscribeThread };
