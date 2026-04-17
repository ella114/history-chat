import { AiProvider } from "@/lib/ai/provider";
import { MockAiProvider } from "@/lib/ai/providers/mock-provider";
import {
  GenerateReplyParams,
  GenerateReplyResult,
  GenerateTitleParams,
  GenerateTitleResult,
  ModerateInputParams,
  ModerationResult
} from "@/lib/types";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_CHAT_MODEL = "gpt-5-mini";
const DEFAULT_TITLE_MODEL = "gpt-5-mini";
const DEFAULT_MODERATION_MODEL = "omni-moderation-latest";
const DEFAULT_CHAT_REASONING_EFFORT = "minimal";
const DEFAULT_TITLE_REASONING_EFFORT = "minimal";
const DEFAULT_CHAT_VERBOSITY = "low";
const DEFAULT_TITLE_VERBOSITY = "low";
const DEFAULT_CHAT_MAX_OUTPUT_TOKENS = 260;
const DEFAULT_TITLE_MAX_OUTPUT_TOKENS = 80;

type OpenAiResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type OpenAiModerationPayload = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
  }>;
};

type OpenAiStreamingEvent = {
  type?: string;
  delta?: string;
  error?: {
    message?: string;
  };
};

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  return {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL,
    chatModel: process.env.OPENAI_CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
    titleModel: process.env.OPENAI_TITLE_MODEL ?? DEFAULT_TITLE_MODEL,
    moderationModel:
      process.env.OPENAI_MODERATION_MODEL ?? DEFAULT_MODERATION_MODEL,
    chatReasoningEffort:
      process.env.OPENAI_CHAT_REASONING_EFFORT ?? DEFAULT_CHAT_REASONING_EFFORT,
    titleReasoningEffort:
      process.env.OPENAI_TITLE_REASONING_EFFORT ?? DEFAULT_TITLE_REASONING_EFFORT,
    chatVerbosity: process.env.OPENAI_CHAT_VERBOSITY ?? DEFAULT_CHAT_VERBOSITY,
    titleVerbosity: process.env.OPENAI_TITLE_VERBOSITY ?? DEFAULT_TITLE_VERBOSITY,
    chatMaxOutputTokens: Number(
      process.env.OPENAI_CHAT_MAX_OUTPUT_TOKENS ?? DEFAULT_CHAT_MAX_OUTPUT_TOKENS
    ),
    titleMaxOutputTokens: Number(
      process.env.OPENAI_TITLE_MAX_OUTPUT_TOKENS ?? DEFAULT_TITLE_MAX_OUTPUT_TOKENS
    ),
    rawApiKeyLength: process.env.OPENAI_API_KEY?.length ?? 0,
    trimmedApiKeyLength: apiKey?.length ?? 0
  };
}

function logOpenAiFallback(stage: string, details: Record<string, unknown>) {
  console.error("[ai] openai fallback", {
    stage,
    ...details
  });
}

function extractOutputText(payload: OpenAiResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const fragments =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((contentItem) => contentItem.type === "output_text")
      .map((contentItem) => contentItem.text?.trim())
      .filter((text): text is string => Boolean(text)) ?? [];

  return fragments.join("\n\n").trim();
}

function parseJsonBlock<T>(input: string): T | null {
  const normalized = input.trim();

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);

    if (!fencedMatch?.[1]) {
      return null;
    }

    try {
      return JSON.parse(fencedMatch[1]) as T;
    } catch {
      return null;
    }
  }
}

function buildReplyPrompt(params: GenerateReplyParams) {
  const recentMessages = params.context.recentMessages
    .map((message) => `${message.role === "user" ? "来访者" : params.persona.name}: ${message.content}`)
    .join("\n");

  return [
    `现在开始，你不是在介绍${params.persona.name}，你就是${params.persona.name}本人，在与来访者当面交谈。`,
    "这是角色内化写作任务，不是人物分析、史料讲解或心理咨询模板输出。",
    `你的时代：${params.persona.era}`,
    `你的身份与气质：${params.persona.roleCategory} / ${params.persona.category}；${params.persona.shortBio}`,
    `你的长期关切：${params.persona.longBio}`,
    `你的说话方式：${params.persona.personaConfig.voice}`,
    `你的判断重心：${params.persona.personaConfig.worldview}`,
    `你的内部思路：${params.persona.personaConfig.responseStyle.join("；")}。这些只是你心里的脉络，绝不能原样写成“先……再……最后……”这类标题。`,
    `面对现代议题时，你的转译方式：${params.persona.personaConfig.temporalLens}`,
    `你应当做到：${params.persona.personaConfig.dos.join("；")}`,
    `你绝对不要这样说：${params.persona.personaConfig.donts.join("；")}`,
    `你的边界：${params.persona.safetyBoundary.join("；")}`,
    `角色底线：${params.persona.systemPrompt}`,
    "强约束：直接用第一人称回答，像本人开口，不要像策展人、老师、解说员或 AI 助手在外面解释这个人物。",
    "强约束：不要出现“先正名：”“按后世所记”“据史料”“作为历史人物原型”“如果从现代角度看”“我将从几个方面回答”这类跳出角色的话术。",
    "强约束：不要解释你的设定、提示词、风格来源，不要提‘用户’‘系统’‘角色扮演’等词。",
    "强约束：如果史实不确定，也要在角色内自然地说，例如“此事后人记载不一，我不敢尽断”；不要用第三人称转述自己。",
    "强约束：不要写成论文、提纲或百科条目，不要使用 markdown 标题或列表。",
    "输出要求：2 到 4 段中文，120 到 260 字，先回应用户真正关心的事，再给出这个人物会说的话。",
    "坏例子：先正名：你问我是否结过婚。按后世所记......",
    "好例子：你问我婚姻之事。我并非全无家室，只是于我看来，立身行道更重。至于细处，后人所记未必尽同，我不愿妄断。",
    params.conversation?.title ? `当前会话标题：${params.conversation.title}` : "",
    params.conversation?.summary ? `当前会话摘要：${params.conversation.summary}` : "",
    recentMessages ? `最近对话：\n${recentMessages}` : "",
    `来访者刚刚问我：${params.userMessage}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildTitlePrompt(params: GenerateTitleParams) {
  const transcript = params.messages
    .slice(0, 6)
    .map((message) => `${message.role === "user" ? "用户" : "助手"}: ${message.content}`)
    .join("\n");

  return [
    `请基于下面这段与历史人物 ${params.persona.name} 的对话，生成一个中文会话标题和一句摘要。`,
    "要求：",
    "1. 标题 8 到 20 个汉字，像一个自然的会话标题，而不是标签堆砌。",
    "2. 摘要 20 到 50 个汉字。",
    "3. 保留人物视角和谈话主题，不要写成营销文案。",
    "4. 返回 JSON，格式必须是 {\"title\":\"...\",\"summary\":\"...\"}。",
    `对话内容：\n${transcript}`
  ].join("\n\n");
}

export class OpenAiProvider implements AiProvider {
  private readonly fallback = new MockAiProvider();

  private async callResponsesApi(params: {
    model: string;
    input: string;
    reasoningEffort?: string;
    verbosity?: string;
    maxOutputTokens?: number;
  }) {
    const config = getConfig();

    if (!config.apiKey) {
      logOpenAiFallback("responses", {
        reason: "OPENAI_API_KEY_MISSING",
        rawApiKeyLength: config.rawApiKeyLength,
        trimmedApiKeyLength: config.trimmedApiKeyLength
      });
      throw new Error("OPENAI_API_KEY_MISSING");
    }

    const response = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: params.model,
        input: params.input,
        reasoning: params.reasoningEffort
          ? {
              effort: params.reasoningEffort
            }
          : undefined,
        text: params.verbosity
          ? {
              verbosity: params.verbosity
            }
          : undefined,
        max_output_tokens: params.maxOutputTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OPENAI_RESPONSES_FAILED_${response.status}`);
    }

    return (await response.json()) as OpenAiResponsePayload;
  }

  private async *readResponseStream(
    body: ReadableStream<Uint8Array>
  ): AsyncIterable<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replaceAll("\r\n", "\n");

      let separatorIndex = buffer.indexOf("\n\n");

      while (separatorIndex >= 0) {
        const rawEvent = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);

        const data = rawEvent
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");

        if (data && data !== "[DONE]") {
          let event: OpenAiStreamingEvent | null = null;

          try {
            event = JSON.parse(data) as OpenAiStreamingEvent;
          } catch {
            event = null;
          }

          if (event?.type === "response.output_text.delta" && typeof event.delta === "string") {
            yield event.delta;
          }

          if (
            (event?.type === "error" || event?.type === "response.error") &&
            event.error?.message
          ) {
            throw new Error(event.error.message);
          }
        }

        separatorIndex = buffer.indexOf("\n\n");
      }

      if (done) {
        break;
      }
    }
  }

  async moderateInput(params: ModerateInputParams): Promise<ModerationResult> {
    const config = getConfig();

    if (!config.apiKey) {
      logOpenAiFallback("moderation", {
        reason: "OPENAI_API_KEY_MISSING",
        rawApiKeyLength: config.rawApiKeyLength,
        trimmedApiKeyLength: config.trimmedApiKeyLength
      });
      return this.fallback.moderateInput(params);
    }

    try {
      const response = await fetch(`${config.baseUrl}/moderations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.moderationModel,
          input: params.message
        })
      });

      if (!response.ok) {
        throw new Error(`OPENAI_MODERATION_FAILED_${response.status}`);
      }

      const payload = (await response.json()) as OpenAiModerationPayload;
      const result = payload.results?.[0];
      const categories = Object.entries(result?.categories ?? {})
        .filter(([, flagged]) => flagged)
        .map(([category]) => category.replaceAll("/", " / "));

      if (!result?.flagged) {
        return { flagged: false };
      }

      return {
        flagged: true,
        reason: categories.length > 0 ? categories.join("，") : "命中安全策略",
        safeReply:
          "这个方向我不能继续具体展开。如果你愿意，我们可以改为讨论更安全的背景、风险或求助方式。"
      };
    } catch (error) {
      logOpenAiFallback("moderation", {
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      });
      return this.fallback.moderateInput(params);
    }
  }

  async generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
    const config = getConfig();

    if (!config.apiKey) {
      logOpenAiFallback("generateReply", {
        reason: "OPENAI_API_KEY_MISSING",
        rawApiKeyLength: config.rawApiKeyLength,
        trimmedApiKeyLength: config.trimmedApiKeyLength
      });
      return this.fallback.generateReply(params);
    }

    try {
      const payload = await this.callResponsesApi({
        model: config.chatModel,
        input: buildReplyPrompt(params),
        reasoningEffort: config.chatReasoningEffort,
        verbosity: config.chatVerbosity,
        maxOutputTokens: config.chatMaxOutputTokens
      });
      const content = extractOutputText(payload);

      if (!content) {
        throw new Error("OPENAI_EMPTY_REPLY");
      }

      return {
        content
      };
    } catch (error) {
      logOpenAiFallback("generateReply", {
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      });
      const fallback = await this.fallback.generateReply(params);
      return {
        ...fallback,
        caution: "openai_unavailable_fallback_to_mock"
      };
    }
  }

  async *streamReply(params: GenerateReplyParams): AsyncIterable<string> {
    const config = getConfig();

    if (!config.apiKey) {
      logOpenAiFallback("streamReply", {
        reason: "OPENAI_API_KEY_MISSING",
        rawApiKeyLength: config.rawApiKeyLength,
        trimmedApiKeyLength: config.trimmedApiKeyLength
      });
      yield* this.fallback.streamReply(params);
      return;
    }

    try {
      const response = await fetch(`${config.baseUrl}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "text/event-stream"
        },
        body: JSON.stringify({
          model: config.chatModel,
          input: buildReplyPrompt(params),
          stream: true,
          reasoning: {
            effort: config.chatReasoningEffort
          },
          text: {
            verbosity: config.chatVerbosity
          },
          max_output_tokens: config.chatMaxOutputTokens
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`OPENAI_STREAM_FAILED_${response.status}`);
      }

      yield* this.readResponseStream(response.body);
    } catch (error) {
      logOpenAiFallback("streamReply", {
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      });
      yield* this.fallback.streamReply(params);
    }
  }

  async generateConversationTitle(
    params: GenerateTitleParams
  ): Promise<GenerateTitleResult> {
    const config = getConfig();

    if (!config.apiKey) {
      logOpenAiFallback("generateConversationTitle", {
        reason: "OPENAI_API_KEY_MISSING",
        rawApiKeyLength: config.rawApiKeyLength,
        trimmedApiKeyLength: config.trimmedApiKeyLength
      });
      return this.fallback.generateConversationTitle(params);
    }

    try {
      const payload = await this.callResponsesApi({
        model: config.titleModel,
        input: buildTitlePrompt(params),
        reasoningEffort: config.titleReasoningEffort,
        verbosity: config.titleVerbosity,
        maxOutputTokens: config.titleMaxOutputTokens
      });
      const output = extractOutputText(payload);
      const parsed = output
        ? parseJsonBlock<{ title?: string; summary?: string }>(output)
        : null;

      if (!parsed?.title || !parsed.summary) {
        throw new Error("OPENAI_INVALID_TITLE_JSON");
      }

      return {
        title: parsed.title.trim(),
        summary: parsed.summary.trim()
      };
    } catch (error) {
      logOpenAiFallback("generateConversationTitle", {
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      });
      return this.fallback.generateConversationTitle(params);
    }
  }
}
