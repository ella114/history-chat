"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { personaIdMap } from "@/lib/data/personas";
import {
  deleteConversation,
  deleteSavedQuote,
  listConversations,
  listSavedQuotes
} from "@/lib/storage/browser-repository";
import { useAuth } from "@/lib/supabase/auth";
import { Conversation, SavedQuote } from "@/lib/types";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";

export function HistoryView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [deletingQuoteMessageId, setDeletingQuoteMessageId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const [nextConversations, nextSavedQuotes] = await Promise.all([
          listConversations(user),
          listSavedQuotes(user)
        ]);

        if (isActive) {
          setConversations(nextConversations);
          setSavedQuotes(nextSavedQuotes);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error && loadError.message
              ? loadError.message
              : "读取聊天记录失败，请稍后重试。"
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user]);

  const grouped = useMemo(() => {
    return conversations.reduce<Record<string, Conversation[]>>((accumulator, conversation) => {
      const key = conversation.personaId;
      accumulator[key] ??= [];
      accumulator[key].push(conversation);
      return accumulator;
    }, {});
  }, [conversations]);

  const personaIds = Object.keys(grouped);

  return (
    <div className="space-y-8">
      <section className="paper-panel rounded-[2rem] border border-border/70 px-8 py-10 shadow-paper">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          History
        </p>
        <h1 className="mt-3 text-4xl">聊天记录</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
          你与历史人物之间的对话会留在这里，方便回看、比较，也方便从上次停下的地方继续。
        </p>
      </section>

      {error ? (
        <Card className="paper-panel border-border/70">
          <CardContent className="px-6 py-8">
            <p className="text-sm leading-7 text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="paper-panel border-border/70">
          <CardContent className="px-6 py-8">
            <p className="text-sm leading-7 text-muted-foreground">正在加载聊天记录……</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && savedQuotes.length > 0 ? (
        <Card className="paper-panel border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>摘句收藏</span>
              <span className="text-sm font-normal text-muted-foreground">
                {savedQuotes.length} 条摘录
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {savedQuotes.map((savedQuote) => {
              const persona = personaIdMap.get(savedQuote.personaId);
              const destinationSlug = persona?.slug;

              return (
                <div
                  key={savedQuote.id}
                  className="rounded-[1.5rem] border border-border/60 bg-background/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        {savedQuote.personaName}
                      </p>
                      <h3 className="text-lg text-foreground">
                        {savedQuote.conversationTitle}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingQuoteMessageId === savedQuote.messageId}
                      onClick={async () => {
                        setDeletingQuoteMessageId(savedQuote.messageId);
                        setError(null);

                        try {
                          await deleteSavedQuote(savedQuote.messageId, user);
                          setSavedQuotes((current) =>
                            current.filter((item) => item.messageId !== savedQuote.messageId)
                          );
                        } catch (deleteError) {
                          setError(
                            deleteError instanceof Error && deleteError.message
                              ? deleteError.message
                              : "删除摘句失败，请稍后重试。"
                          );
                        } finally {
                          setDeletingQuoteMessageId((current) =>
                            current === savedQuote.messageId ? null : current
                          );
                        }
                      }}
                    >
                      {deletingQuoteMessageId === savedQuote.messageId ? "移除中..." : "移除"}
                    </Button>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                    {savedQuote.content}
                  </p>

                  {savedQuote.footnotes.length > 0 ? (
                    <div className="mt-4 rounded-[1.3rem] border border-border/60 bg-background/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
                      <p className="text-xs uppercase tracking-[0.22em] text-foreground/70">
                        史实注脚
                      </p>
                      <p className="mt-1">{savedQuote.footnotes[0]?.content}</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      收藏于 {formatRelativeTime(savedQuote.createdAt)}
                    </p>
                    {destinationSlug ? (
                      <Link
                        href={`/chat/${destinationSlug}?conversation=${savedQuote.conversationId}`}
                        className={cn(buttonVariants({ variant: "secondary" }))}
                      >
                        回到对话
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && personaIds.length === 0 ? (
        <Card className="paper-panel border-border/70">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl">还没有聊天记录</h2>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                从首页先进入角色分类，再选择人物开始第一段对话后，会话将自动出现在这里。
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants())}>
              去首页选分类
            </Link>
          </CardContent>
        </Card>
      ) : !isLoading && personaIds.length > 0 ? (
        <div className="space-y-6">
          {personaIds.map((personaId) => {
            const persona = personaIdMap.get(personaId);

            if (!persona) {
              return null;
            }

            return (
              <Card key={personaId} className="paper-panel border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4">
                    <span>{persona.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {grouped[personaId].length} 段对话
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {grouped[personaId].map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex flex-col gap-4 rounded-[1.5rem] border border-border/60 bg-background/70 p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg text-foreground">{conversation.title}</h3>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                          {truncate(conversation.summary, 100)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          最近更新 {formatRelativeTime(conversation.updatedAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-3">
                        <Link
                          href={`/chat/${persona.slug}?conversation=${conversation.id}`}
                          className={cn(buttonVariants({ variant: "secondary" }))}
                        >
                          继续聊天
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            setDeletingConversationId(conversation.id);
                            setError(null);

                            try {
                              await deleteConversation(conversation.id, user);
                              const [nextConversations, nextSavedQuotes] = await Promise.all([
                                listConversations(user),
                                listSavedQuotes(user)
                              ]);
                              setConversations(nextConversations);
                              setSavedQuotes(nextSavedQuotes);
                            } catch (deleteError) {
                              setError(
                                deleteError instanceof Error && deleteError.message
                                  ? deleteError.message
                                  : "删除聊天记录失败，请稍后重试。"
                              );
                            } finally {
                              setDeletingConversationId((current) =>
                                current === conversation.id ? null : current
                              );
                            }
                          }}
                          disabled={deletingConversationId === conversation.id}
                        >
                          {deletingConversationId === conversation.id ? "删除中..." : "删除"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
