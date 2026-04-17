import {
  ChatApiRequest,
  ChatTitleApiRequest,
  Conversation,
  Message
} from "@/lib/types";

const VALID_MESSAGE_ROLES = new Set<Message["role"]>([
  "user",
  "assistant",
  "system"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.conversationId === "string" &&
    VALID_MESSAGE_ROLES.has(value.role as Message["role"]) &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string"
  );
}

function isConversationSummary(
  value: unknown
): value is Pick<Conversation, "title" | "summary"> | null {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.title === "string" &&
      typeof value.summary === "string")
  );
}

export function parseChatApiRequest(body: unknown): ChatApiRequest | null {
  if (!isRecord(body)) {
    return null;
  }

  if (
    typeof body.personaId !== "string" ||
    typeof body.userInput !== "string" ||
    !Array.isArray(body.messages) ||
    !isConversationSummary(body.conversation)
  ) {
    return null;
  }

  if (!body.userInput.trim()) {
    return null;
  }

  if (!body.messages.every(isMessage)) {
    return null;
  }

  return {
    personaId: body.personaId,
    conversation: body.conversation,
    messages: body.messages,
    userInput: body.userInput
  };
}

export function parseChatTitleApiRequest(
  body: unknown
): ChatTitleApiRequest | null {
  if (
    !isRecord(body) ||
    typeof body.personaId !== "string" ||
    !Array.isArray(body.messages)
  ) {
    return null;
  }

  if (!body.messages.every(isMessage)) {
    return null;
  }

  return {
    personaId: body.personaId,
    messages: body.messages
  };
}
