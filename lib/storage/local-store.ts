"use client";

import {
  Conversation,
  Feedback,
  LocalDatabase,
  Message,
  SavedQuote
} from "@/lib/types";

const STORAGE_KEY = "history-persona-chat-db";

function createEmptyDatabase(): LocalDatabase {
  return {
    conversations: [],
    messages: [],
    feedback: [],
    savedQuotes: []
  };
}

function readDatabase(): LocalDatabase {
  if (typeof window === "undefined") {
    return createEmptyDatabase();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createEmptyDatabase();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;

    return {
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
      feedback: parsed.feedback ?? [],
      savedQuotes: parsed.savedQuotes ?? []
    };
  } catch {
    return createEmptyDatabase();
  }
}

function writeDatabase(database: LocalDatabase) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function getConversationById(conversationId: string) {
  const database = readDatabase();
  return database.conversations.find((item) => item.id === conversationId) ?? null;
}

export function listConversations() {
  const database = readDatabase();

  return [...database.conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function listMessages(conversationId: string) {
  const database = readDatabase();

  return database.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listFeedback(conversationId: string) {
  const database = readDatabase();
  const messageIds = new Set(
    database.messages
      .filter((message) => message.conversationId === conversationId)
      .map((message) => message.id)
  );

  return database.feedback.filter((item) => messageIds.has(item.messageId));
}

export function upsertConversation(conversation: Conversation) {
  const database = readDatabase();
  const index = database.conversations.findIndex((item) => item.id === conversation.id);

  if (index >= 0) {
    database.conversations[index] = conversation;
  } else {
    database.conversations.push(conversation);
  }

  writeDatabase(database);
}

export function appendMessage(message: Message) {
  const database = readDatabase();
  database.messages.push(message);

  const conversation = database.conversations.find(
    (item) => item.id === message.conversationId
  );

  if (conversation) {
    conversation.updatedAt = message.createdAt;
  }

  writeDatabase(database);
}

export function saveConversationBundle(params: {
  conversation: Conversation;
  messages: Message[];
}) {
  const database = readDatabase();
  const conversationIndex = database.conversations.findIndex(
    (item) => item.id === params.conversation.id
  );

  if (conversationIndex >= 0) {
    database.conversations[conversationIndex] = params.conversation;
  } else {
    database.conversations.push(params.conversation);
  }

  database.messages = database.messages.filter(
    (message) => message.conversationId !== params.conversation.id
  );
  database.messages.push(...params.messages);

  writeDatabase(database);
}

export function upsertFeedback(feedback: Feedback) {
  const database = readDatabase();
  const index = database.feedback.findIndex(
    (item) => item.messageId === feedback.messageId
  );

  if (index >= 0) {
    database.feedback[index] = feedback;
  } else {
    database.feedback.push(feedback);
  }

  writeDatabase(database);
}

export function deleteConversation(conversationId: string) {
  const database = readDatabase();
  const messageIds = new Set(
    database.messages
      .filter((message) => message.conversationId === conversationId)
      .map((message) => message.id)
  );

  database.conversations = database.conversations.filter(
    (conversation) => conversation.id !== conversationId
  );
  database.messages = database.messages.filter(
    (message) => message.conversationId !== conversationId
  );
  database.feedback = database.feedback.filter(
    (item) => !messageIds.has(item.messageId)
  );
  database.savedQuotes = database.savedQuotes.filter(
    (item) => item.conversationId !== conversationId
  );

  writeDatabase(database);
}

export function listSavedQuotes() {
  const database = readDatabase();

  return [...database.savedQuotes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function upsertSavedQuote(savedQuote: SavedQuote) {
  const database = readDatabase();
  const index = database.savedQuotes.findIndex(
    (item) => item.messageId === savedQuote.messageId
  );

  if (index >= 0) {
    database.savedQuotes[index] = savedQuote;
  } else {
    database.savedQuotes.push(savedQuote);
  }

  writeDatabase(database);
}

export function deleteSavedQuote(messageId: string) {
  const database = readDatabase();
  database.savedQuotes = database.savedQuotes.filter(
    (item) => item.messageId !== messageId
  );
  writeDatabase(database);
}
