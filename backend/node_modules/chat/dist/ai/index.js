import {
  toAiMessages
} from "../chunk-YUZG5S7P.js";
import {
  addReactionSpec,
  applyOverrides,
  createToolSpecFactories,
  deleteMessageSpec,
  editMessageSpec,
  fetchChannelMessagesSpec,
  fetchMessagesSpec,
  fetchThreadSpec,
  getChannelInfoSpec,
  getThreadParticipantsSpec,
  getUserSpec,
  listThreadsSpec,
  postChannelMessageSpec,
  postMessageSpec,
  removeReactionSpec,
  selectToolSpecs,
  sendDirectMessageSpec,
  startTypingSpec,
  subscribeThreadSpec,
  unsubscribeThreadSpec
} from "../chunk-3CQWNJXG.js";
import "../chunk-NHNHX3US.js";
import "../chunk-BPCHXMC3.js";

// src/ai/tools/ai-sdk.ts
import { tool } from "ai";
function toAiTool(spec) {
  const definition = {
    description: spec.description,
    inputSchema: spec.inputSchema,
    execute: (input) => spec.execute(input),
    ...spec.needsApproval === void 0 ? {} : { needsApproval: spec.needsApproval }
  };
  return tool(definition);
}
var fetchMessages = (chat, guard) => toAiTool(fetchMessagesSpec(chat, guard));
var fetchChannelMessages = (chat, guard) => toAiTool(fetchChannelMessagesSpec(chat, guard));
var fetchThread = (chat, guard) => toAiTool(fetchThreadSpec(chat, guard));
var listThreads = (chat, guard) => toAiTool(listThreadsSpec(chat, guard));
var getThreadParticipants = (chat, guard) => toAiTool(getThreadParticipantsSpec(chat, guard));
var getChannelInfo = (chat, guard) => toAiTool(getChannelInfoSpec(chat, guard));
var getUser = (chat, needsApproval = true) => toAiTool(getUserSpec(chat, needsApproval));
var startTyping = (chat, guard) => toAiTool(startTypingSpec(chat, guard));
var postMessage = (chat, options = {}) => toAiTool(postMessageSpec(chat, options));
var postChannelMessage = (chat, options = {}) => toAiTool(postChannelMessageSpec(chat, options));
var sendDirectMessage = (chat, options = {}) => toAiTool(sendDirectMessageSpec(chat, options));
var editMessage = (chat, options = {}) => toAiTool(editMessageSpec(chat, options));
var deleteMessage = (chat, options = {}) => toAiTool(deleteMessageSpec(chat, options));
var addReaction = (chat, options = {}) => toAiTool(addReactionSpec(chat, options));
var removeReaction = (chat, options = {}) => toAiTool(removeReactionSpec(chat, options));
var subscribeThread = (chat, options = {}) => toAiTool(subscribeThreadSpec(chat, options));
var unsubscribeThread = (chat, options = {}) => toAiTool(unsubscribeThreadSpec(chat, options));

// src/ai/index.ts
var PROTECTED_TOOL_FIELDS = /* @__PURE__ */ new Set([
  "args",
  "execute",
  "id",
  "inputSchema",
  "outputSchema",
  "supportsDeferredResults",
  "type"
]);
function createChatTools({
  overrides,
  preset,
  ...base
}) {
  const factories = createToolSpecFactories(base, "createChatTools");
  const entries = selectToolSpecs(factories, preset).map(
    ([name, spec]) => [
      name,
      applyOverrides(
        toAiTool(spec),
        overrides?.[name],
        PROTECTED_TOOL_FIELDS
      )
    ]
  );
  return Object.fromEntries(entries);
}
export {
  addReaction,
  createChatTools,
  deleteMessage,
  editMessage,
  fetchChannelMessages,
  fetchMessages,
  fetchThread,
  getChannelInfo,
  getThreadParticipants,
  getUser,
  listThreads,
  postChannelMessage,
  postMessage,
  removeReaction,
  sendDirectMessage,
  startTyping,
  subscribeThread,
  toAiMessages,
  unsubscribeThread
};
