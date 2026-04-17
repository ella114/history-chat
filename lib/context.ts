import { Conversation, ConversationContext, Message } from "@/lib/types";

export const MAX_CONTEXT_MESSAGES = 8;

export function getRecentMessages(messages: Message[]) {
  return messages.slice(-MAX_CONTEXT_MESSAGES);
}

export function buildConversationContext(
  conversation: Pick<Conversation, "title" | "summary"> | null,
  messages: Message[]
): ConversationContext {
  return {
    title: conversation?.title,
    summary: conversation?.summary,
    recentMessages: getRecentMessages(messages)
  };
}
