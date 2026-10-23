export { ar as ChannelImpl, M as Message, aW as MessageData, bf as SerializedChannel, bg as SerializedMessage, bh as SerializedThread, bl as ThreadImpl } from './types-kdVm1MWj.js';
import './jsx-runtime-bmw6xUDW.js';
import 'mdast';
import '@workflow/serde';

/**
 * Standalone JSON reviver for Chat SDK objects.
 *
 * Restores serialized Thread, Channel, and Message instances during
 * JSON.parse() without requiring a Chat instance. This is useful in
 * environments like Vercel Workflow functions where importing the full
 * Chat instance (with its adapter dependencies) is not possible.
 *
 * Thread instances created this way use lazy adapter resolution —
 * the adapter is looked up from the Chat singleton when first accessed,
 * so `chat.registerSingleton()` must be called before using thread
 * methods like `post()` (typically inside a "use step" function).
 */

declare function reviver(_key: string, value: unknown): unknown;

export { reviver };
