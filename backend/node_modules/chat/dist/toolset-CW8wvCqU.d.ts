import { a0 as ChannelVisibility } from './types-kdVm1MWj.js';
import { ZodType } from 'zod';
import { C as Chat } from './chat-CCrOm5ZQ.js';

/**
 * The Chat instance used by all tools to dispatch operations.
 * Always typed as `Chat<any, any>` so callers can pass strongly-typed
 * `Chat` instances without having to repeat their adapter/state generics.
 */
type ChatBinding = Chat<any, any>;
/**
 * Common options for write tools that may require approval before executing.
 */
interface ToolOptions {
    /** Scope guard the tool calls on its target id before executing. */
    guard?: ScopeGuard;
    needsApproval?: boolean;
}

/**
 * The conversation a toolset is confined to. Pass the `Thread` or
 * `Channel` the agent is running in, or a raw thread/channel id.
 */
type ReadScope = string | {
    id: string;
};
type ScopeGuard = (id: string) => void;

/**
 * Framework-agnostic description of a Chat SDK tool.
 *
 * Every tool in `chat/ai` is defined once as a spec and then wrapped for a
 * specific agent framework: `createChatTools` turns specs into Vercel AI SDK
 * tools and `createTanStackTools` (from `chat/ai/tanstack`) turns them into
 * TanStack AI tools. Specs never import from either framework, so the
 * TanStack entry stays dependency-free at runtime.
 *
 * `execute` is declared as a method so a spec with a narrow input type is
 * assignable to `ChatToolSpec<unknown, unknown>` collections.
 */
interface ChatToolSpec<TInput = unknown, TOutput = unknown> {
    description: string;
    execute(input: TInput): Promise<TOutput>;
    inputSchema: ZodType<TInput>;
    name: string;
    needsApproval?: boolean;
}

type ChatToolName = "fetchMessages" | "fetchChannelMessages" | "fetchThread" | "listThreads" | "getThreadParticipants" | "getChannelInfo" | "getUser" | "startTyping" | "postMessage" | "postChannelMessage" | "sendDirectMessage" | "editMessage" | "deleteMessage" | "addReaction" | "removeReaction" | "subscribeThread" | "unsubscribeThread";
/**
 * Names of every tool that mutates platform state.
 * These default to `needsApproval: true` and can be toggled via
 * `requireApproval` on `createChatTools` and `createTanStackTools`.
 */
type ChatWriteToolName = "postMessage" | "postChannelMessage" | "sendDirectMessage" | "editMessage" | "deleteMessage" | "addReaction" | "removeReaction" | "subscribeThread" | "unsubscribeThread";
/**
 * Names of tools that require approval by default.
 *
 * This includes every write tool plus `getUser`, whose arbitrary user lookup
 * can expose profile details outside the active conversation.
 */
type ChatApprovalToolName = ChatWriteToolName | "getUser";
/**
 * Whether sensitive operations require user approval.
 *
 * - `true`  — every approval-gated tool needs approval (default)
 * - `false` — no tool needs approval
 * - object  — per-tool override; unspecified approval-gated tools default to `true`
 *
 * @example
 * ```ts
 * requireApproval: {
 *   deleteMessage: true,
 *   postMessage: false,
 *   sendDirectMessage: false,
 *   addReaction: false,
 * }
 * ```
 */
type ApprovalConfig = boolean | Partial<Record<ChatApprovalToolName, boolean>>;
/**
 * Predefined tool presets for common chat-agent use cases.
 *
 * - `'reader'`    — read-only: fetch threads, messages, channel info, users
 * - `'messenger'` — basic posting: post in thread/channel, DM, react, typing
 * - `'moderator'` — full management: read + write + edit/delete + subscriptions
 */
type ChatToolPreset = "reader" | "messenger" | "moderator";
/**
 * Options shared by every framework-specific tool factory
 * (`createChatTools`, `createTanStackTools`).
 */
interface ChatToolsBaseOptions {
    /** The Chat instance the tools dispatch operations against. */
    chat: ChatBinding;
    /**
     * Restrict the returned tools to a predefined preset.
     * Omit to get all tools (same as `'moderator'`).
     *
     * @example
     * ```ts
     * createChatTools({ chat, preset: 'reader' })
     * createChatTools({ chat, preset: ['reader', 'messenger'] })
     * ```
     */
    preset?: ChatToolPreset | ChatToolPreset[];
    /**
     * Whether sensitive operations require user approval before executing.
     * Defaults to `true` for all write tools and `getUser`.
     *
     * @see {@link ApprovalConfig}
     */
    requireApproval?: ApprovalConfig;
    /**
     * Confine tools to a single conversation, so a thread or channel id the
     * model supplies that resolves elsewhere is rejected. Applies to reads and
     * writes that target a thread or channel; `getUser` and `sendDirectMessage`
     * target user ids and are gated by approval instead.
     *
     * Scoping is channel-level: a call is allowed when it resolves to the same
     * channel as the scoped conversation, so a thread scope still permits sibling
     * threads within that channel. Set {@link ChatToolsBaseOptions.strictScope}
     * to tighten a thread scope to that thread alone.
     *
     * Defaults to the conversation being handled, so tools created inside a
     * handler are already confined to it. Set this when the agent runs outside
     * a handler and still acts on a user's behalf, or pass a channel id to
     * operate channel-wide.
     *
     * Pass `false` to reach every conversation the bot can see. When no
     * scope resolves (outside a handler, no explicit scope), tools run
     * workspace-wide and a warning is logged.
     *
     * @example
     * ```ts
     * bot.onNewMention(async (thread) => {
     *   const tools = createChatTools({ chat, preset: 'reader' })
     * })
     * ```
     */
    scope?: ReadScope | false;
    /**
     * Tighten `scope` from channel-level (default) to conversation-level.
     *
     * By default a call is in scope when it resolves to the same channel as the
     * scoped conversation, so a thread scope still permits sibling threads in
     * that channel. Set `true` to confine a thread scope to that thread alone:
     * sibling threads and the parent channel are both rejected, which matters
     * on platforms where a channel is the widest surface available (a GitHub
     * channel is an entire repo). A channel scope is unaffected; it still
     * allows any thread within the channel.
     *
     * @default false
     */
    strictScope?: boolean;
}
/**
 * Build the lazy spec factories for every Chat SDK tool, wired with the
 * approval flags and scope guard derived from `options`.
 *
 * Each entry is built lazily so a preset filter skips both the approval
 * lookup and the spec (and its zod schema) construction for tools the agent
 * will never see.
 */
declare function createToolSpecFactories({ chat, requireApproval, scope, strictScope, }: ChatToolsBaseOptions, caller: string): {
    fetchMessages: () => ChatToolSpec<{
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
    fetchChannelMessages: () => ChatToolSpec<{
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
    fetchThread: () => ChatToolSpec<{
        threadId: string;
    }, {
        id: string;
        channelId: string;
        channelName: string | undefined;
        channelVisibility: ChannelVisibility | undefined;
        isDM: boolean;
    }>;
    listThreads: () => ChatToolSpec<{
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
    getThreadParticipants: () => ChatToolSpec<{
        threadId: string;
    }, {
        participants: {
            userId: string;
            userName: string;
            fullName: string;
            isBot: boolean | "unknown";
        }[];
    }>;
    getChannelInfo: () => ChatToolSpec<{
        channelId: string;
    }, {
        id: string;
        name: string | undefined;
        isDM: boolean;
        memberCount: number | undefined;
        channelVisibility: ChannelVisibility | undefined;
    }>;
    getUser: () => ChatToolSpec<{
        userId: string;
    }, {
        userId: string;
        userName: string;
        fullName: string;
        email: string | undefined;
        isBot: boolean;
        avatarUrl: string | undefined;
    } | null>;
    startTyping: () => ChatToolSpec<{
        threadId: string;
        status?: string | undefined;
    }, {
        typing: boolean;
        threadId: string;
    }>;
    postMessage: () => ChatToolSpec<{
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
    postChannelMessage: () => ChatToolSpec<{
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
    sendDirectMessage: () => ChatToolSpec<{
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
    editMessage: () => ChatToolSpec<{
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
    deleteMessage: () => ChatToolSpec<{
        threadId: string;
        messageId: string;
    }, {
        deleted: boolean;
        messageId: string;
        threadId: string;
    }>;
    addReaction: () => ChatToolSpec<{
        threadId: string;
        messageId: string;
        emoji: string;
    }, {
        added: boolean;
        emoji: string;
        messageId: string;
        threadId: string;
    }>;
    removeReaction: () => ChatToolSpec<{
        threadId: string;
        messageId: string;
        emoji: string;
    }, {
        removed: boolean;
        emoji: string;
        messageId: string;
        threadId: string;
    }>;
    subscribeThread: () => ChatToolSpec<{
        threadId: string;
    }, {
        subscribed: boolean;
        threadId: string;
    }>;
    unsubscribeThread: () => ChatToolSpec<{
        threadId: string;
    }, {
        subscribed: boolean;
        threadId: string;
    }>;
};
type ChatToolSpecFactories = ReturnType<typeof createToolSpecFactories>;

export type { ApprovalConfig as A, ChatBinding as C, ReadScope as R, ScopeGuard as S, ToolOptions as T, ChatToolsBaseOptions as a, ChatToolName as b, ChatToolSpec as c, ChatToolSpecFactories as d, ChatApprovalToolName as e, ChatToolPreset as f, ChatWriteToolName as g };
