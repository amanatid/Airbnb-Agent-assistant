import {
  activeConversation
} from "./chunk-NHNHX3US.js";

// src/ai/scope.ts
function channelOf(chat, id) {
  const prefix = id.split(":")[0];
  const adapter = prefix ? chat.getAdapter(prefix) : void 0;
  return adapter?.channelIdFromThreadId?.(id) ?? id.split(":").slice(0, 2).join(":");
}
function createScopeGuard(chat, scope, strict = false) {
  if (scope === false) {
    return;
  }
  let explicit;
  if (scope !== void 0) {
    explicit = typeof scope === "string" ? scope : scope.id;
  }
  let warnedUnscoped = false;
  return (id) => {
    const active = explicit ?? activeConversation();
    if (!active) {
      if (!warnedUnscoped) {
        warnedUnscoped = true;
        chat.getLogger().warn(
          `Agent tool ran unscoped: "${id}" was accessed workspace-wide because no conversation is being handled and no \`scope\` was set. Pass \`scope\` to createChatTools to confine tools.`
        );
      }
      return;
    }
    const activeChannel = channelOf(chat, active);
    const targetChannel = channelOf(chat, id);
    const sameChannel = targetChannel === activeChannel;
    const scopeIsChannel = active === activeChannel;
    const inScope = sameChannel && (!strict || scopeIsChannel || id === active);
    if (!inScope) {
      throw new Error(
        `Tool call blocked: tools are scoped to "${active}", but "${id}" resolves outside it.`
      );
    }
  };
}

// src/ai/tools/channels.ts
import { z } from "zod";
var GET_CHANNEL_INFO_INPUT = z.object({
  channelId: z.string().describe("Full channel id including adapter prefix")
});
var getChannelInfoSpec = (chat, guard) => ({
  name: "getChannelInfo",
  description: "Fetch metadata for a channel: name, member count, DM status, visibility, etc. Use to identify a channel before posting.",
  inputSchema: GET_CHANNEL_INFO_INPUT,
  execute: async ({ channelId }) => {
    guard?.(channelId);
    const channel = chat.channel(channelId);
    const info = await channel.fetchMetadata();
    return {
      id: info.id,
      name: info.name,
      isDM: info.isDM ?? false,
      memberCount: info.memberCount,
      channelVisibility: info.channelVisibility
    };
  }
});

// src/ai/tools/messages.ts
import { z as z2 } from "zod";
var POSTABLE_INPUT = z2.union([
  z2.string().describe("Plain text body"),
  z2.object({ markdown: z2.string() }).describe("Markdown body, converted to the platform's native format"),
  z2.object({ raw: z2.string() }).describe("Raw body, passed through to the platform untouched")
]).describe("Message body");
var POST_MESSAGE_INPUT = z2.object({
  threadId: z2.string().describe("Full thread id including adapter prefix"),
  message: POSTABLE_INPUT
});
var postMessageSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "postMessage",
  description: "Post a message inside an existing thread. Use this to reply within a conversation the bot already has context for. The threadId is the full id (e.g. 'slack:C123:1234567890.123456').",
  needsApproval,
  inputSchema: POST_MESSAGE_INPUT,
  execute: async ({ threadId, message }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    const sent = await thread.post(toPostable(message));
    return {
      messageId: sent.id,
      threadId: sent.threadId
    };
  }
});
var POST_CHANNEL_MESSAGE_INPUT = z2.object({
  channelId: z2.string().describe("Full channel id including adapter prefix"),
  message: POSTABLE_INPUT
});
var postChannelMessageSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "postChannelMessage",
  description: "Post a top-level message to a channel (not threaded under an existing message). The channelId is the full id (e.g. 'slack:C123ABC').",
  needsApproval,
  inputSchema: POST_CHANNEL_MESSAGE_INPUT,
  execute: async ({ channelId, message }) => {
    guard?.(channelId);
    const channel = chat.channel(channelId);
    const sent = await channel.post(toPostable(message));
    return {
      messageId: sent.id,
      threadId: sent.threadId
    };
  }
});
var SEND_DIRECT_MESSAGE_INPUT = z2.object({
  userId: z2.string().describe("Platform-specific user id; the adapter is auto-detected"),
  message: POSTABLE_INPUT
});
var sendDirectMessageSpec = (chat, { needsApproval = true } = {}) => ({
  name: "sendDirectMessage",
  description: "Open (or reuse) a 1:1 direct-message conversation with a user and post a message in it. The userId format is platform-specific (e.g. 'U123456' for Slack, 'users/123' for Google Chat).",
  needsApproval,
  inputSchema: SEND_DIRECT_MESSAGE_INPUT,
  execute: async ({ userId, message }) => {
    const dm = await chat.openDM(userId);
    const sent = await dm.post(toPostable(message));
    return {
      messageId: sent.id,
      threadId: sent.threadId
    };
  }
});
var EDIT_MESSAGE_INPUT = z2.object({
  threadId: z2.string().describe("Full thread id"),
  messageId: z2.string().describe("Platform-specific message id of the message to edit"),
  message: POSTABLE_INPUT
});
var editMessageSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "editMessage",
  description: "Edit a previously posted message in a thread. Replaces the existing message body. Only messages the bot itself authored can be edited on most platforms.",
  needsApproval,
  inputSchema: EDIT_MESSAGE_INPUT,
  execute: async ({ threadId, messageId, message }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    const result = await thread.adapter.editMessage(
      threadId,
      messageId,
      toPostable(message)
    );
    return { messageId: result.id, threadId: result.threadId };
  }
});
var DELETE_MESSAGE_INPUT = z2.object({
  threadId: z2.string().describe("Full thread id"),
  messageId: z2.string().describe("Platform-specific message id of the message to delete")
});
var deleteMessageSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "deleteMessage",
  description: "Delete a message from a thread. Only messages the bot itself authored can be deleted on most platforms.",
  needsApproval,
  inputSchema: DELETE_MESSAGE_INPUT,
  execute: async ({
    threadId,
    messageId
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.adapter.deleteMessage(threadId, messageId);
    return { deleted: true, messageId, threadId };
  }
});
function toPostable(input) {
  if (typeof input === "string") {
    return input;
  }
  if ("markdown" in input) {
    return { markdown: input.markdown };
  }
  return { raw: input.raw };
}

// src/ai/tools/reactions.ts
import { z as z3 } from "zod";
var ADD_REACTION_INPUT = z3.object({
  threadId: z3.string().describe("Full thread id"),
  messageId: z3.string().describe("Platform-specific message id to react to"),
  emoji: z3.string().describe(
    "Emoji name or platform shortcode (e.g. 'thumbs_up', 'white_check_mark')"
  )
});
var addReactionSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "addReaction",
  description: "Add an emoji reaction to a specific message. Use a well-known emoji name (e.g. 'thumbs_up', 'heart', 'check') or a platform-native shorthand.",
  needsApproval,
  inputSchema: ADD_REACTION_INPUT,
  execute: async ({
    threadId,
    messageId,
    emoji
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.adapter.addReaction(threadId, messageId, emoji);
    return { added: true, emoji, messageId, threadId };
  }
});
var REMOVE_REACTION_INPUT = z3.object({
  threadId: z3.string().describe("Full thread id"),
  messageId: z3.string().describe("Platform-specific message id to remove the reaction from"),
  emoji: z3.string().describe("Emoji name or platform shortcode previously added by the bot")
});
var removeReactionSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "removeReaction",
  description: "Remove an emoji reaction the bot previously added to a message.",
  needsApproval,
  inputSchema: REMOVE_REACTION_INPUT,
  execute: async ({
    threadId,
    messageId,
    emoji
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.adapter.removeReaction(threadId, messageId, emoji);
    return { removed: true, emoji, messageId, threadId };
  }
});

// src/ai/tools/threads.ts
import { z as z4 } from "zod";
var FETCH_DIRECTION = z4.enum(["forward", "backward"]).optional().default("backward");
function projectMessage(message) {
  return {
    id: message.id,
    threadId: message.threadId,
    text: message.text,
    author: {
      userId: message.author.userId,
      userName: message.author.userName,
      fullName: message.author.fullName,
      isBot: message.author.isBot,
      isMe: message.author.isMe
    },
    dateSent: message.metadata.dateSent?.toISOString(),
    edited: message.metadata.edited,
    isMention: message.isMention,
    attachments: (message.attachments ?? []).map((att) => ({
      type: att.type,
      name: att.name,
      mimeType: att.mimeType,
      url: att.url
    }))
  };
}
var FETCH_MESSAGES_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id"),
  limit: z4.number().int().min(1).max(100).optional().default(20).describe("Maximum number of messages to fetch"),
  cursor: z4.string().optional().describe("Pagination cursor from a previous fetchMessages call"),
  direction: FETCH_DIRECTION.describe(
    "'backward' (default) returns the most recent messages; 'forward' iterates from the oldest"
  )
});
var fetchMessagesSpec = (chat, guard) => ({
  name: "fetchMessages",
  description: "Fetch recent messages from a thread, ordered chronologically (oldest first within the page). Use to read the conversation before responding.",
  inputSchema: FETCH_MESSAGES_INPUT,
  execute: async ({ threadId, limit, cursor, direction }) => {
    guard?.(threadId);
    const result = await chat.history.thread.list(threadId, {
      limit,
      cursor,
      direction
    });
    return {
      messages: result.messages.map(projectMessage),
      nextCursor: result.nextCursor
    };
  }
});
var FETCH_CHANNEL_MESSAGES_INPUT = z4.object({
  channelId: z4.string().describe("Full channel id"),
  limit: z4.number().int().min(1).max(100).optional().default(20),
  cursor: z4.string().optional(),
  direction: FETCH_DIRECTION
});
var fetchChannelMessagesSpec = (chat, guard) => ({
  name: "fetchChannelMessages",
  description: "Fetch top-level messages in a channel (not thread replies). Returns messages in chronological order within the page.",
  inputSchema: FETCH_CHANNEL_MESSAGES_INPUT,
  execute: async ({ channelId, limit, cursor, direction }) => {
    guard?.(channelId);
    const result = await chat.history.channel.listMessages(channelId, {
      limit,
      cursor,
      direction
    });
    return {
      messages: result.messages.map(projectMessage),
      nextCursor: result.nextCursor
    };
  }
});
var FETCH_THREAD_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id")
});
var fetchThreadSpec = (chat, guard) => ({
  name: "fetchThread",
  description: "Fetch metadata about a thread (channel id, channel name, visibility, DM status, etc).",
  inputSchema: FETCH_THREAD_INPUT,
  execute: async ({ threadId }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    const info = await thread.adapter.fetchThread(threadId);
    return {
      id: info.id,
      channelId: info.channelId,
      channelName: info.channelName,
      channelVisibility: info.channelVisibility,
      isDM: info.isDM ?? false
    };
  }
});
var LIST_THREADS_INPUT = z4.object({
  channelId: z4.string().describe("Full channel id"),
  limit: z4.number().int().min(1).max(100).optional().default(20),
  cursor: z4.string().optional()
});
var listThreadsSpec = (chat, guard) => ({
  name: "listThreads",
  description: "List recent threads in a channel. Returns lightweight summaries with the root message of each thread.",
  inputSchema: LIST_THREADS_INPUT,
  execute: async ({ channelId, limit, cursor }) => {
    guard?.(channelId);
    const result = await chat.history.channel.listThreads(channelId, {
      limit,
      cursor
    });
    return {
      threads: result.threads.map((t) => ({
        id: t.id,
        replyCount: t.replyCount,
        lastReplyAt: t.lastReplyAt?.toISOString(),
        rootMessage: projectMessage(t.rootMessage)
      })),
      nextCursor: result.nextCursor
    };
  }
});
var GET_THREAD_PARTICIPANTS_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id")
});
var getThreadParticipantsSpec = (chat, guard) => ({
  name: "getThreadParticipants",
  description: "Return the unique non-bot participants in a thread. Useful for deciding whether to subscribe (1:1) or stay quiet (group).",
  inputSchema: GET_THREAD_PARTICIPANTS_INPUT,
  execute: async ({ threadId }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    const participants = await thread.getParticipants();
    return {
      participants: participants.map((author) => ({
        userId: author.userId,
        userName: author.userName,
        fullName: author.fullName,
        isBot: author.isBot
      }))
    };
  }
});
var SUBSCRIBE_THREAD_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id to subscribe to")
});
var subscribeThreadSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "subscribeThread",
  description: "Subscribe to all future messages in a thread. After subscribing, the bot will receive every message in this thread (not just @mentions).",
  needsApproval,
  inputSchema: SUBSCRIBE_THREAD_INPUT,
  execute: async ({
    threadId
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.subscribe();
    return { subscribed: true, threadId };
  }
});
var UNSUBSCRIBE_THREAD_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id to unsubscribe from")
});
var unsubscribeThreadSpec = (chat, { needsApproval = true, guard } = {}) => ({
  name: "unsubscribeThread",
  description: "Unsubscribe from a thread. The bot will stop receiving non-mention messages in this thread.",
  needsApproval,
  inputSchema: UNSUBSCRIBE_THREAD_INPUT,
  execute: async ({
    threadId
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.unsubscribe();
    return { subscribed: false, threadId };
  }
});
var START_TYPING_INPUT = z4.object({
  threadId: z4.string().describe("Full thread id"),
  status: z4.string().optional().describe(
    "Optional human-readable status (some platforms display this, others ignore it)"
  )
});
var startTypingSpec = (chat, guard) => ({
  name: "startTyping",
  description: "Show a typing indicator in a thread. Use this when starting a long-running operation so users know the bot is working.",
  inputSchema: START_TYPING_INPUT,
  execute: async ({
    threadId,
    status
  }) => {
    guard?.(threadId);
    const thread = chat.thread(threadId);
    await thread.startTyping(status);
    return { typing: true, threadId };
  }
});

// src/ai/tools/users.ts
import { z as z5 } from "zod";
var GET_USER_INPUT = z5.object({
  userId: z5.string().describe("Platform-specific user id; the adapter is auto-detected")
});
var getUserSpec = (chat, needsApproval = true) => ({
  name: "getUser",
  description: "Look up profile information about a user by their platform-specific id (e.g. 'U123456' for Slack, '29:...' for Teams, 'users/123' for Google Chat). Returns null if the user is unknown.",
  inputSchema: GET_USER_INPUT,
  needsApproval,
  execute: async ({ userId }) => {
    const user = await chat.getUser(userId);
    if (!user) {
      return null;
    }
    return {
      userId: user.userId,
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      isBot: user.isBot,
      avatarUrl: user.avatarUrl
    };
  }
});

// src/ai/toolset.ts
var PRESET_TOOLS = {
  reader: [
    "fetchMessages",
    "fetchChannelMessages",
    "fetchThread",
    "listThreads",
    "getThreadParticipants",
    "getChannelInfo",
    "getUser"
  ],
  messenger: [
    "fetchMessages",
    "fetchThread",
    "getChannelInfo",
    "getUser",
    "postMessage",
    "postChannelMessage",
    "sendDirectMessage",
    "addReaction",
    "removeReaction",
    "startTyping"
  ],
  moderator: [
    "fetchMessages",
    "fetchChannelMessages",
    "fetchThread",
    "listThreads",
    "getThreadParticipants",
    "getChannelInfo",
    "getUser",
    "postMessage",
    "postChannelMessage",
    "sendDirectMessage",
    "editMessage",
    "deleteMessage",
    "addReaction",
    "removeReaction",
    "subscribeThread",
    "unsubscribeThread",
    "startTyping"
  ]
};
function resolveApproval(toolName, config) {
  if (typeof config === "boolean") {
    return config;
  }
  return config[toolName] ?? true;
}
function resolvePresetTools(preset) {
  const presets = Array.isArray(preset) ? preset : [preset];
  const tools = /* @__PURE__ */ new Set();
  for (const p of presets) {
    for (const t of PRESET_TOOLS[p]) {
      tools.add(t);
    }
  }
  return tools;
}
function applyOverrides(tool, overrides, protectedFields) {
  if (!overrides) {
    return tool;
  }
  const safeOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([key]) => !protectedFields.has(key))
  );
  return { ...tool, ...safeOverrides };
}
function createToolSpecFactories({
  chat,
  requireApproval = true,
  scope,
  strictScope = false
}, caller) {
  if (!chat) {
    throw new Error(
      `${caller} requires a \`chat\` instance. Pass your \`new Chat({ ... })\` instance as the \`chat\` option.`
    );
  }
  const guard = createScopeGuard(chat, scope, strictScope);
  const approval = (name) => ({
    needsApproval: resolveApproval(name, requireApproval)
  });
  const guardedApproval = (name) => ({
    ...approval(name),
    guard
  });
  return {
    fetchMessages: () => fetchMessagesSpec(chat, guard),
    fetchChannelMessages: () => fetchChannelMessagesSpec(chat, guard),
    fetchThread: () => fetchThreadSpec(chat, guard),
    listThreads: () => listThreadsSpec(chat, guard),
    getThreadParticipants: () => getThreadParticipantsSpec(chat, guard),
    getChannelInfo: () => getChannelInfoSpec(chat, guard),
    getUser: () => getUserSpec(chat, approval("getUser").needsApproval),
    startTyping: () => startTypingSpec(chat, guard),
    postMessage: () => postMessageSpec(chat, guardedApproval("postMessage")),
    postChannelMessage: () => postChannelMessageSpec(chat, guardedApproval("postChannelMessage")),
    // User-id tools do not resolve to a conversation, so approval is their
    // gate instead of the conversation-scope guard.
    sendDirectMessage: () => sendDirectMessageSpec(chat, approval("sendDirectMessage")),
    editMessage: () => editMessageSpec(chat, guardedApproval("editMessage")),
    deleteMessage: () => deleteMessageSpec(chat, guardedApproval("deleteMessage")),
    addReaction: () => addReactionSpec(chat, guardedApproval("addReaction")),
    removeReaction: () => removeReactionSpec(chat, guardedApproval("removeReaction")),
    subscribeThread: () => subscribeThreadSpec(chat, guardedApproval("subscribeThread")),
    unsubscribeThread: () => unsubscribeThreadSpec(chat, guardedApproval("unsubscribeThread"))
  };
}
function selectToolSpecs(factories, preset) {
  const allowed = preset ? resolvePresetTools(preset) : null;
  return Object.entries(factories).filter(([name]) => !allowed || allowed.has(name)).map(([name, build]) => [name, build()]);
}

export {
  getChannelInfoSpec,
  postMessageSpec,
  postChannelMessageSpec,
  sendDirectMessageSpec,
  editMessageSpec,
  deleteMessageSpec,
  addReactionSpec,
  removeReactionSpec,
  fetchMessagesSpec,
  fetchChannelMessagesSpec,
  fetchThreadSpec,
  listThreadsSpec,
  getThreadParticipantsSpec,
  subscribeThreadSpec,
  unsubscribeThreadSpec,
  startTypingSpec,
  getUserSpec,
  applyOverrides,
  createToolSpecFactories,
  selectToolSpecs
};
