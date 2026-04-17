"use client";

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  FeedbackType,
  HistoricalFootnote,
  Message,
  Persona
} from "@/lib/types";
import { cn } from "@/lib/utils";

const feedbackOptions: Array<{ label: string; value: FeedbackType }> = [
  { label: "很像", value: "like" },
  { label: "不像", value: "unlike" },
  { label: "跑偏了", value: "off_topic" },
  { label: "太像普通 AI", value: "too_generic" },
  { label: "太现代了", value: "too_modern" }
];

export function MessageBubble({
  message,
  persona,
  userLabel,
  isStreaming,
  activeFeedback,
  onFeedback,
  footnotes = [],
  isQuoteSaved,
  onToggleQuoteSave
}: {
  message: Message;
  persona: Persona;
  userLabel: string;
  isStreaming?: boolean;
  activeFeedback?: FeedbackType;
  onFeedback?: (type: FeedbackType) => void;
  footnotes?: HistoricalFootnote[];
  isQuoteSaved?: boolean;
  onToggleQuoteSave?: () => void;
}) {
  const isAssistant = message.role === "assistant";
  const [showFootnotes, setShowFootnotes] = useState(false);
  const speaker = isAssistant ? persona.name : userLabel;
  const hasFootnotes = isAssistant && !isStreaming && footnotes.length > 0;
  const avatar = isAssistant ? (
    <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-border/70 bg-accent/60 shadow-sm">
      <Image
        src={persona.avatar}
        alt={persona.name}
        fill
        className="object-cover"
        sizes="44px"
      />
    </div>
  ) : (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-sm font-medium text-primary shadow-sm">
      {userLabel.slice(0, 1)}
    </div>
  );

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {isAssistant ? avatar : null}
      <div className="max-w-3xl space-y-3">
        <p
          className={cn(
            "text-xs uppercase tracking-[0.22em] text-muted-foreground",
            message.role === "user" ? "text-right" : "text-left"
          )}
        >
          {speaker}
        </p>
        <div
          className={cn(
            "rounded-[1.6rem] border px-5 py-4 text-sm leading-7 shadow-sm",
            message.role === "user"
              ? "border-primary/10 bg-primary text-primary-foreground"
              : "border-border/70 bg-card text-card-foreground"
          )}
        >
          <p className="whitespace-pre-wrap">
            {message.content}
            {isStreaming ? (
              <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-current align-[-3px]" />
            ) : null}
          </p>
        </div>

        {isAssistant && (hasFootnotes || onToggleQuoteSave) ? (
          <div className="flex flex-wrap gap-2">
            {hasFootnotes ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFootnotes((current) => !current)}
              >
                {showFootnotes ? "收起注脚" : "史实注脚"}
              </Button>
            ) : null}
            {onToggleQuoteSave ? (
              <Button
                variant={isQuoteSaved ? "secondary" : "ghost"}
                size="sm"
                onClick={onToggleQuoteSave}
              >
                {isQuoteSaved ? "已收藏" : "摘句收藏"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {isAssistant && showFootnotes && hasFootnotes ? (
          <div className="space-y-3 rounded-[1.4rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-7 text-muted-foreground">
            {footnotes.map((footnote) => (
              <div key={footnote.title} className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/70">
                  {footnote.title}
                </p>
                <p>{footnote.content}</p>
              </div>
            ))}
          </div>
        ) : null}

        {isAssistant && onFeedback ? (
          <div className="flex flex-wrap gap-2">
            {feedbackOptions.map((option) => (
              <Button
                key={option.value}
                variant={activeFeedback === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onFeedback(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {!isAssistant ? avatar : null}
    </div>
  );
}
