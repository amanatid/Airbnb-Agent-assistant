import {
  applyOverrides,
  createToolSpecFactories,
  selectToolSpecs
} from "../../chunk-3CQWNJXG.js";
import {
  buildMessageText,
  defaultUnsupportedAttachmentWarning,
  fetchAttachmentContent,
  isUnsupportedAttachment,
  sortByDateSent
} from "../../chunk-NHNHX3US.js";
import "../../chunk-BPCHXMC3.js";

// src/ai/tanstack/messages.ts
function toBase64(data) {
  return data instanceof ArrayBuffer ? Buffer.from(data).toString("base64") : data.toString("base64");
}
function toUtf8(data) {
  return data instanceof ArrayBuffer ? Buffer.from(data).toString("utf8") : data.toString("utf8");
}
async function collectUserAttachments(msg, onUnsupported) {
  const imageParts = [];
  const fileBlocks = [];
  for (const att of msg.attachments ?? []) {
    const fetched = await fetchAttachmentContent(att, "toTanStackMessages");
    if (fetched?.kind === "image") {
      imageParts.push({
        type: "image",
        source: {
          type: "data",
          value: toBase64(fetched.data),
          mimeType: fetched.mimeType
        }
      });
    } else if (fetched?.kind === "text-file") {
      const name = fetched.filename ?? "attachment";
      fileBlocks.push(
        `[File: ${name} (${fetched.mimeType})]
${toUtf8(fetched.data)}`
      );
    } else if (isUnsupportedAttachment(att)) {
      onUnsupported(att, msg);
    }
  }
  return { imageParts, fileBlocks };
}
async function toTanStackMessages(messages, options) {
  const includeNames = options?.includeNames ?? false;
  const transformMessage = options?.transformMessage;
  const onUnsupported = options?.onUnsupportedAttachment ?? defaultUnsupportedAttachmentWarning("toTanStackMessages");
  const sorted = sortByDateSent(messages);
  const results = await Promise.all(
    sorted.map(async (msg) => {
      const role = msg.author.isMe ? "assistant" : "user";
      let textContent = buildMessageText(msg, { includeNames, role });
      let tanStackMessage;
      if (role === "user") {
        const { imageParts, fileBlocks } = await collectUserAttachments(
          msg,
          onUnsupported
        );
        if (fileBlocks.length > 0) {
          const files = fileBlocks.join("\n\n");
          textContent = textContent ? `${textContent}

${files}` : files;
        }
        if (imageParts.length > 0) {
          const parts = textContent ? [{ type: "text", content: textContent }, ...imageParts] : imageParts;
          tanStackMessage = { role, content: parts };
        } else {
          tanStackMessage = { role, content: textContent };
        }
      } else {
        tanStackMessage = { role, content: textContent };
      }
      const isEmpty = typeof tanStackMessage.content === "string" ? tanStackMessage.content.trim().length === 0 : tanStackMessage.content.length === 0;
      if (isEmpty) {
        return null;
      }
      if (transformMessage) {
        return await transformMessage(tanStackMessage, msg);
      }
      return tanStackMessage;
    })
  );
  return results.filter((r) => r != null);
}

// src/ai/tanstack/tools.ts
var PROTECTED_TOOL_FIELDS = /* @__PURE__ */ new Set([
  "execute",
  "inputSchema",
  "name",
  "outputSchema"
]);
function assertStandardJsonSchema(schema) {
  const standard = schema?.["~standard"];
  if (typeof standard?.jsonSchema?.input !== "function") {
    throw new Error(
      "createTanStackTools requires zod 4.2 or newer: TanStack AI converts tool input schemas through the Standard JSON Schema interface (`~standard.jsonSchema`), which the installed zod version does not implement."
    );
  }
}
function toTanStackTool(spec) {
  const built = {
    name: spec.name,
    description: spec.description,
    inputSchema: spec.inputSchema,
    execute: (args) => spec.execute(args)
  };
  if (spec.needsApproval !== void 0) {
    built.needsApproval = spec.needsApproval;
  }
  return built;
}
function createTanStackTools({
  overrides,
  preset,
  ...base
}) {
  const factories = createToolSpecFactories(base, "createTanStackTools");
  const specs = selectToolSpecs(factories, preset);
  const first = specs[0];
  if (first) {
    assertStandardJsonSchema(first[1].inputSchema);
  }
  return specs.map(
    ([name, spec]) => applyOverrides(
      toTanStackTool(spec),
      overrides?.[name],
      PROTECTED_TOOL_FIELDS
    )
  );
}
export {
  createTanStackTools,
  toTanStackMessages
};
