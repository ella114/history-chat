"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { MessageBubble } from "@/components/chat/message-bubble";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  appendConversationMessage,
  deleteSavedQuote,
  getConversationById,
  listFeedback,
  listMessages,
  listSavedQuotes,
  upsertSavedQuote,
  upsertConversation,
  upsertFeedback
} from "@/lib/storage/browser-repository";
import { getRecentMessages } from "@/lib/context";
import { buildHistoricalFootnotes } from "@/lib/history-footnotes";
import { useAuth } from "@/lib/supabase/auth";
import {
  ChatTitleApiResponse,
  Conversation,
  Feedback,
  FeedbackType,
  Message,
  Persona,
  SavedQuote
} from "@/lib/types";
import { createId, formatRelativeTime } from "@/lib/utils";

function buildDraftConversation(personaId: string): Conversation {
  const now = new Date().toISOString();

  return {
    id: createId("conv"),
    userId: null,
    personaId,
    title: "新的对话",
    summary: "对话刚刚开始，标题和摘要将根据前几轮内容自动生成。",
    createdAt: now,
    updatedAt: now
  };
}

function mergeMessagesById(current: Message[], incoming: Message[]) {
  const merged = new Map<string, Message>();

  [...current, ...incoming].forEach((message) => {
    merged.set(message.id, message);
  });

  return [...merged.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

function shouldMergeMessages(current: Message[], conversationId: string) {
  return current.length === 0 || current.every((message) => message.conversationId === conversationId);
}

function getErrorMessage(error: unknown, fallback = "请求失败，请稍后重试。") {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function getResponseErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as { error?: string };

      if (payload.error) {
        return payload.error;
      }
    } catch {
      // Ignore JSON parse failures and fall back to status-based messages.
    }
  }

  try {
    const text = (await response.text()).trim();

    if (text) {
      return text;
    }
  } catch {
    // Ignore response read failures and fall back to status-based messages.
  }

  return `请求失败（${response.status}）`;
}

export function ChatShell({
  persona,
  conversationId
}: {
  persona: Persona;
  conversationId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const { user } = useAuth();
  const conversationRef = useRef<Conversation | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const loadRequestRef = useRef(0);
  const titleRequestRef = useRef(0);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const nextSavedQuotes = await listSavedQuotes(user);

        if (isActive) {
          setSavedQuotes(nextSavedQuotes);
        }
      } catch {
        if (isActive) {
          setSavedQuotes([]);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    const requestId = ++loadRequestRef.current;

    if (!conversationId) {
      setError(null);
      setIsLoadingConversation(false);
      setConversation(null);
      setMessages([]);
      setFeedback([]);
      return;
    }

    setIsLoadingConversation(true);
    setError(null);

    void (async () => {
      try {
        const existingConversation = await getConversationById(conversationId, user);

        if (loadRequestRef.current !== requestId) {
          return;
        }

        if (!existingConversation || existingConversation.personaId !== persona.id) {
          if (conversationRef.current?.id === conversationId) {
            return;
          }

          setConversation(null);
          setMessages([]);
          setFeedback([]);
          return;
        }

        const [nextMessages, nextFeedback] = await Promise.all([
          listMessages(existingConversation.id, user),
          listFeedback(existingConversation.id, user)
        ]);

        if (loadRequestRef.current !== requestId) {
          return;
        }

        setConversation((current) => {
          if (current?.id !== existingConversation.id) {
            return existingConversation;
          }

          return current.updatedAt.localeCompare(existingConversation.updatedAt) > 0
            ? current
            : existingConversation;
        });
        setMessages((current) =>
          shouldMergeMessages(current, existingConversation.id)
            ? mergeMessagesById(current, nextMessages)
            : nextMessages
        );
        setFeedback(nextFeedback);
      } catch (loadError) {
        if (loadRequestRef.current !== requestId) {
          return;
        }

        setError(getErrorMessage(loadError, "读取对话失败，请稍后重试。"));
      } finally {
        if (loadRequestRef.current === requestId) {
          setIsLoadingConversation(false);
        }
      }
    })();
  }, [conversationId, persona.id, user]);

  const feedbackMap = useMemo(() => {
    return new Map(feedback.map((item) => [item.messageId, item.type]));
  }, [feedback]);
  const savedQuoteMap = useMemo(() => {
    return new Map(savedQuotes.map((item) => [item.messageId, item]));
  }, [savedQuotes]);
  const userLabel =
    typeof user?.user_metadata?.username === "string" && user.user_metadata.username.trim()
      ? user.user_metadata.username.trim()
      : "我";

  async function handleSend(rawContent?: string) {
    const content = (rawContent ?? input).trim();

    if (!content || isSending) {
      return;
    }

    setError(null);
    setInput("");
    setIsSending(true);

    const previousConversation = conversationRef.current;
    const previousMessages = messagesRef.current;
    const activeConversation = conversationRef.current ?? buildDraftConversation(persona.id);
    const userMessage: Message = {
      id: createId("msg"),
      conversationId: activeConversation.id,
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };

    const nextConversation: Conversation = {
      ...activeConversation,
      updatedAt: userMessage.createdAt
    };

    const nextMessages = mergeMessagesById(messagesRef.current, [userMessage]);

    conversationRef.current = nextConversation;
    messagesRef.current = nextMessages;
    setConversation(nextConversation);
    setMessages(nextMessages);
    let assistantMessageId: string | null = null;

    try {
      await Promise.all([
        upsertConversation(nextConversation, user),
        appendConversationMessage(userMessage, user)
      ]);

      if (!conversationId) {
        startTransition(() => {
          router.replace(`/chat/${persona.slug}?conversation=${activeConversation.id}`);
        });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personaId: persona.id,
          conversation: {
            title: nextConversation.title,
            summary: nextConversation.summary
          },
          messages: getRecentMessages(nextMessages),
          userInput: content
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response));
      }

      const assistantMessage: Message = {
        id: createId("msg"),
        conversationId: activeConversation.id,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      };
      assistantMessageId = assistantMessage.id;

      const updatedConversation: Conversation = {
        ...nextConversation,
        updatedAt: assistantMessage.createdAt
      };

      conversationRef.current = updatedConversation;
      setConversation(updatedConversation);
      setStreamingMessageId(assistantMessage.id);
      const draftMessages = mergeMessagesById(messagesRef.current, [assistantMessage]);

      messagesRef.current = draftMessages;
      setMessages(draftMessages);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            assistantContent += decoder.decode();
            break;
          }

          assistantContent += decoder.decode(value, { stream: true });
          const streamedAssistantMessage: Message = {
            ...assistantMessage,
            content: assistantContent
          };
          const streamedMessages = mergeMessagesById(messagesRef.current, [streamedAssistantMessage]);
          messagesRef.current = streamedMessages;
          setMessages(streamedMessages);
        }
      } else {
        assistantContent = await response.text();
      }

      const finalAssistantMessage: Message = {
        ...assistantMessage,
        content: assistantContent.trim()
      };
      const assistantMessages = mergeMessagesById(messagesRef.current, [finalAssistantMessage]);

      messagesRef.current = assistantMessages;
      setMessages(assistantMessages);
      setStreamingMessageId(null);

      try {
        await Promise.all([
          upsertConversation(updatedConversation, user),
          appendConversationMessage(finalAssistantMessage, user)
        ]);
      } catch (persistError) {
        setError(
          getErrorMessage(
            persistError,
            "回复已生成，但保存失败。刷新后可能看不到这条消息。"
          )
        );
        return;
      }

      void refreshConversationTitle(activeConversation.id, assistantMessages);
    } catch (error) {
      setStreamingMessageId(null);
      if (assistantMessageId) {
        setMessages((current) => {
          const next = current.filter((message) => message.id !== assistantMessageId);
          messagesRef.current = next;
          return next;
        });
        conversationRef.current = nextConversation;
        setConversation(nextConversation);
      } else {
        conversationRef.current = previousConversation;
        messagesRef.current = previousMessages;
        setConversation(previousConversation);
        setMessages(previousMessages);
        setInput(content);
      }

      setError(
        getErrorMessage(error, "请求失败，请稍后重试。")
      );
    } finally {
      setIsSending(false);
    }
  }

  async function refreshConversationTitle(
    targetConversationId: string,
    nextMessages: Message[]
  ) {
    if (nextMessages.filter((message) => message.role === "user").length === 0) {
      return;
    }

    const requestId = ++titleRequestRef.current;

    try {
      const response = await fetch("/api/chat/title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personaId: persona.id,
          messages: nextMessages
        })
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as ChatTitleApiResponse;

      if (titleRequestRef.current !== requestId) {
        return;
      }

      setConversation((current) => {
        if (!current || current.id !== targetConversationId) {
          return current;
        }

        const titledConversation: Conversation = {
          ...current,
          title: payload.titleSuggestion.title,
          summary: payload.titleSuggestion.summary
        };

        conversationRef.current = titledConversation;
        void upsertConversation(titledConversation, user).catch(() => {
          // Keep the refreshed title in memory even if background persistence fails.
        });
        return titledConversation;
      });
    } catch {
      // Ignore background title refresh failures and keep the current conversation title.
    }
  }

  function handleFeedback(messageId: string, type: FeedbackType) {
    const item: Feedback = {
      id: createId("fb"),
      messageId,
      personaId: persona.id,
      type,
      createdAt: new Date().toISOString()
    };

    setFeedback((current) => {
      const rest = current.filter((feedbackItem) => feedbackItem.messageId !== messageId);
      return [...rest, item];
    });
    void upsertFeedback(item, user);
  }

  async function handleToggleQuoteSave(message: Message) {
    const existing = savedQuoteMap.get(message.id);

    try {
      if (existing) {
        await deleteSavedQuote(message.id, user);
        setSavedQuotes((current) =>
          current.filter((item) => item.messageId !== message.id)
        );
        return;
      }

      const footnotes = buildHistoricalFootnotes(persona);
      const nextSavedQuote: SavedQuote = {
        id: createId("quote"),
        messageId: message.id,
        conversationId: message.conversationId,
        conversationTitle: conversationRef.current?.title ?? persona.name,
        personaId: persona.id,
        personaName: persona.name,
        content: message.content,
        footnotes,
        createdAt: new Date().toISOString()
      };

      await upsertSavedQuote(nextSavedQuote, user);
      setSavedQuotes((current) => [nextSavedQuote, ...current]);
    } catch (saveError) {
      setError(
        getErrorMessage(saveError, "摘句收藏失败，请稍后重试。")
      );
    }
  }

  const sessionLabel = conversation
    ? `${conversation.title} · ${formatRelativeTime(conversation.updatedAt)}`
    : "新对话";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.45fr]">
      <aside className="space-y-5">
        <Card className="paper-panel border-border/70">
          <CardHeader className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-[1.4rem] border border-border/70 bg-accent/60">
                <Image
                  src={persona.avatar}
                  alt={persona.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge>{persona.roleCategory}</Badge>
                  <Badge variant="secondary">{persona.category}</Badge>
                  <Badge variant="secondary">{persona.era}</Badge>
                </div>
                <CardTitle className="text-3xl">{persona.name}</CardTitle>
                <p className="text-sm leading-7 text-muted-foreground">
                  {persona.shortBio}
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-border/60 bg-background/70 px-4 py-3 text-sm leading-7 text-muted-foreground">
              这是基于历史公开资料构建的 AI 对话体，并非真实本人复现。若历史事实存疑，系统会保留不确定。
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                当前会话
              </p>
              <p className="mt-2 text-base leading-7 text-foreground/85">
                {sessionLabel}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                风格关键词
              </p>
              <div className="flex flex-wrap gap-2">
                {persona.styleKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                免责声明
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {persona.disclaimer}
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="paper-panel flex min-h-[72vh] flex-col rounded-[2rem] border border-border/70 shadow-paper">
        <div className="border-b border-border/60 px-6 py-5">
          <h1 className="text-2xl">{persona.name}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            从一个具体处境开始发问，会更容易进入这位人物真正关心的问题与语气。
          </p>
        </div>

        <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {isLoadingConversation ? (
            <div className="rounded-[1.4rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-7 text-muted-foreground">
              正在加载这段对话……
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-6">
              <div className="rounded-[1.7rem] border border-border/70 bg-background/70 p-6">
                <h2 className="text-xl">从一个具体问题开始</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  试着把困惑放进一个场景里，例如关系、选择、责任、创作或失落，这样更容易听见人物真正的回应。
                </p>
              </div>
              <SuggestedPrompts
                prompts={persona.suggestedQuestions.slice(0, 5)}
                onSelect={(prompt) => {
                  void handleSend(prompt);
                }}
              />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                persona={persona}
                userLabel={userLabel}
                isStreaming={message.id === streamingMessageId}
                activeFeedback={feedbackMap.get(message.id)}
                footnotes={
                  message.role === "assistant"
                    ? buildHistoricalFootnotes(persona)
                    : []
                }
                isQuoteSaved={savedQuoteMap.has(message.id)}
                onToggleQuoteSave={
                  message.role === "assistant" &&
                  message.id !== streamingMessageId &&
                  message.content.trim()
                    ? () => {
                        void handleToggleQuoteSave(message);
                      }
                    : undefined
                }
                onFeedback={
                  message.role === "assistant"
                    ? (type) => handleFeedback(message.id, type)
                    : undefined
                }
              />
            ))
          )}

          {error ? (
            <div className="rounded-[1.4rem] border border-destructive/25 bg-red-50 px-4 py-3 text-sm leading-7 text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 px-6 py-5">
          <div className="space-y-4">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`试着问 ${persona.name} 一个具体处境，比如“我总在比较里耗尽自己，该怎么办？”`}
              rows={4}
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs leading-6 text-muted-foreground">
                这是一场基于史料气质重建的想象对谈，系统会尽量保留人物边界与历史分寸。
              </p>
              <Button
                onClick={() => {
                  void handleSend();
                }}
                disabled={isPending || isSending}
              >
                {isPending || isSending ? "生成中..." : "发送"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
