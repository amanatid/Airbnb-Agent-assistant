import {
  buildMessageText,
  defaultUnsupportedAttachmentWarning,
  fetchAttachmentContent,
  isUnsupportedAttachment,
  sortByDateSent
} from "./chunk-NHNHX3US.js";

// src/ai/messages.ts
async function attachmentToPart(att) {
  const fetched = await fetchAttachmentContent(att, "toAiMessages");
  if (!fetched) {
    return null;
  }
  const { data, mimeType } = fetched;
  return {
    type: "file",
    data: data instanceof ArrayBuffer ? data : `data:${mimeType};base64,${data.toString("base64")}`,
    mediaType: mimeType,
    filename: fetched.filename
  };
}
async function toAiMessages(messages, options) {
  const includeNames = options?.includeNames ?? false;
  const transformMessage = options?.transformMessage;
  const onUnsupported = options?.onUnsupportedAttachment ?? defaultUnsupportedAttachmentWarning("toAiMessages");
  const sorted = sortByDateSent(messages);
  const results = await Promise.all(
    sorted.map(async (msg) => {
      const role = msg.author.isMe ? "assistant" : "user";
      const textContent = buildMessageText(msg, { includeNames, role });
      let aiMessage;
      if (role === "user") {
        const attachmentParts = [];
        for (const att of msg.attachments ?? []) {
          const part = await attachmentToPart(att);
          if (part) {
            attachmentParts.push(part);
          } else if (isUnsupportedAttachment(att)) {
            onUnsupported(att, msg);
          }
        }
        if (attachmentParts.length > 0) {
          const parts = textContent ? [{ type: "text", text: textContent }, ...attachmentParts] : attachmentParts;
          aiMessage = { role, content: parts };
        } else {
          aiMessage = { role, content: textContent };
        }
      } else {
        aiMessage = { role, content: textContent };
      }
      const isEmpty = typeof aiMessage.content === "string" ? aiMessage.content.trim().length === 0 : aiMessage.content.length === 0;
      if (isEmpty) {
        return { result: null, source: msg };
      }
      if (transformMessage) {
        return { result: await transformMessage(aiMessage, msg), source: msg };
      }
      return { result: aiMessage, source: msg };
    })
  );
  return results.filter(
    (r) => r.result != null
  ).map((r) => r.result);
}

export {
  toAiMessages
};
