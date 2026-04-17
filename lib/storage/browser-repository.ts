"use client";

import type { User } from "@supabase/supabase-js";

import {
  deleteSavedQuote as deleteLocalSavedQuote,
  appendMessage,
  deleteConversation as deleteLocalConversation,
  getConversationById as getLocalConversationById,
  listConversations as listLocalConversations,
  listFeedback as listLocalFeedback,
  listMessages as listLocalMessages,
  listSavedQuotes as listLocalSavedQuotes,
  upsertSavedQuote as upsertLocalSavedQuote,
  upsertConversation as upsertLocalConversation,
  upsertFeedback as upsertLocalFeedback
} from "@/lib/storage/local-store";
import {
  createSupabaseBrowserClient,
  isSupabaseEnabled
} from "@/lib/supabase/client";
import { Conversation, Feedback, Message, SavedQuote } from "@/lib/types";

function logSupabaseFallback(operation: string, error: unknown) {
  console.warn(`[storage] supabase fallback: ${operation}`, error);
}

function mergeById<T extends { id: string }>(primary: T[], secondary: T[]) {
  const merged = new Map<string, T>();

  [...secondary, ...primary].forEach((item) => {
    merged.set(item.id, item);
  });

  return [...merged.values()];
}

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    personaId: String(row.persona_id),
    title: String(row.title),
    summary: String(row.summary),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role as Message["role"],
    content: String(row.content),
    createdAt: String(row.created_at)
  };
}

function mapFeedback(row: Record<string, unknown>): Feedback {
  return {
    id: String(row.id),
    messageId: String(row.message_id),
    personaId: String(row.persona_id),
    type: row.type as Feedback["type"],
    createdAt: String(row.created_at)
  };
}

function mapSavedQuote(row: Record<string, unknown>): SavedQuote {
  return {
    id: String(row.id),
    messageId: String(row.message_id),
    conversationId: String(row.conversation_id),
    conversationTitle: String(row.conversation_title),
    personaId: String(row.persona_id),
    personaName: String(row.persona_name),
    content: String(row.content),
    footnotes: Array.isArray(row.footnotes)
      ? row.footnotes.map((item) => ({
          title:
            typeof item === "object" &&
            item !== null &&
            "title" in item &&
            typeof item.title === "string"
              ? item.title
              : "",
          content:
            typeof item === "object" &&
            item !== null &&
            "content" in item &&
            typeof item.content === "string"
              ? item.content
              : ""
        }))
      : [],
    createdAt: String(row.created_at)
  };
}

function shouldUseSupabaseData(user: User | null) {
  return isSupabaseEnabled() && Boolean(user);
}

export async function getConversationById(
  conversationId: string,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    return getLocalConversationById(conversationId);
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapConversation(data) : getLocalConversationById(conversationId);
  } catch (error) {
    logSupabaseFallback("getConversationById", error);
    return getLocalConversationById(conversationId);
  }
}

export async function listConversations(user: User | null) {
  if (!shouldUseSupabaseData(user)) {
    return listLocalConversations();
  }

  const localConversations = listLocalConversations();

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return mergeById((data ?? []).map(mapConversation), localConversations).sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt)
    );
  } catch (error) {
    logSupabaseFallback("listConversations", error);
    return localConversations;
  }
}

export async function listMessages(conversationId: string, user: User | null) {
  if (!shouldUseSupabaseData(user)) {
    return listLocalMessages(conversationId);
  }

  const localMessages = listLocalMessages(conversationId);

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return mergeById((data ?? []).map(mapMessage), localMessages).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  } catch (error) {
    logSupabaseFallback("listMessages", error);
    return localMessages;
  }
}

export async function listFeedback(conversationId: string, user: User | null) {
  if (!shouldUseSupabaseData(user)) {
    return listLocalFeedback(conversationId);
  }

  const localFeedback = listLocalFeedback(conversationId);

  try {
    const messages = await listMessages(conversationId, user);
    const messageIds = messages.map((message) => message.id);

    if (messageIds.length === 0) {
      return localFeedback;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .in("message_id", messageIds);

    if (error) {
      throw error;
    }

    return mergeById((data ?? []).map(mapFeedback), localFeedback).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  } catch (error) {
    logSupabaseFallback("listFeedback", error);
    return localFeedback;
  }
}

export async function upsertConversation(
  conversation: Conversation,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    upsertLocalConversation(conversation);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("conversations").upsert(
      {
        id: conversation.id,
        user_id: user?.id ?? null,
        persona_id: conversation.personaId,
        title: conversation.title,
        summary: conversation.summary,
        created_at: conversation.createdAt,
        updated_at: conversation.updatedAt
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("upsertConversation", error);
    upsertLocalConversation(conversation);
  }
}

export async function appendConversationMessage(
  message: Message,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    appendMessage(message);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("messages").insert({
      id: message.id,
      conversation_id: message.conversationId,
      role: message.role,
      content: message.content,
      created_at: message.createdAt
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("appendConversationMessage", error);
    appendMessage(message);
  }
}

export async function upsertFeedback(
  feedback: Feedback,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    upsertLocalFeedback(feedback);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("feedback").upsert(
      {
        id: feedback.id,
        message_id: feedback.messageId,
        persona_id: feedback.personaId,
        type: feedback.type,
        created_at: feedback.createdAt
      },
      { onConflict: "message_id" }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("upsertFeedback", error);
    upsertLocalFeedback(feedback);
  }
}

export async function deleteConversation(
  conversationId: string,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    deleteLocalConversation(conversationId);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("deleteConversation", error);
  } finally {
    deleteLocalConversation(conversationId);
  }
}

export async function listSavedQuotes(user: User | null) {
  if (!shouldUseSupabaseData(user)) {
    return listLocalSavedQuotes();
  }

  const localSavedQuotes = listLocalSavedQuotes();

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("saved_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return mergeById((data ?? []).map(mapSavedQuote), localSavedQuotes).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
  } catch (error) {
    logSupabaseFallback("listSavedQuotes", error);
    return localSavedQuotes;
  }
}

export async function upsertSavedQuote(
  savedQuote: SavedQuote,
  user: User | null
) {
  if (!shouldUseSupabaseData(user)) {
    upsertLocalSavedQuote(savedQuote);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("saved_quotes").upsert(
      {
        id: savedQuote.id,
        message_id: savedQuote.messageId,
        conversation_id: savedQuote.conversationId,
        conversation_title: savedQuote.conversationTitle,
        persona_id: savedQuote.personaId,
        persona_name: savedQuote.personaName,
        content: savedQuote.content,
        footnotes: savedQuote.footnotes,
        created_at: savedQuote.createdAt
      },
      { onConflict: "message_id" }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("upsertSavedQuote", error);
    upsertLocalSavedQuote(savedQuote);
  }
}

export async function deleteSavedQuote(messageId: string, user: User | null) {
  if (!shouldUseSupabaseData(user)) {
    deleteLocalSavedQuote(messageId);
    return;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("saved_quotes")
      .delete()
      .eq("message_id", messageId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logSupabaseFallback("deleteSavedQuote", error);
  } finally {
    deleteLocalSavedQuote(messageId);
  }
}
