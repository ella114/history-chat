import { NextRequest, NextResponse } from "next/server";

import { assessInputRisk } from "@/lib/ai/input-risk";
import { getAiProvider } from "@/lib/ai";
import { parseChatApiRequest } from "@/lib/api/request-validation";
import { buildConversationContext } from "@/lib/context";
import { personaIdMap } from "@/lib/data/personas";

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    {
      error
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("请求体不是合法 JSON。");
  }

  const body = parseChatApiRequest(payload);

  if (!body) {
    return jsonError("请求参数不合法。");
  }

  const persona = personaIdMap.get(body.personaId);

  if (!persona) {
    return jsonError("人物不存在。", 404);
  }

  const provider = getAiProvider();
  const riskAssessment = assessInputRisk(body.userInput);
  const moderation =
    riskAssessment.level === "uncertain"
      ? await provider.moderateInput({
          persona,
          message: body.userInput
        })
      : riskAssessment.moderation;

  if (moderation.flagged) {
    return new Response(
      moderation.safeReply ??
        "这个方向我不能继续展开。我们可以换个更安全的问题。",
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache"
        }
      }
    );
  }

  const context = buildConversationContext(body.conversation, body.messages);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of provider.streamReply({
          persona,
          conversation: body.conversation,
          context,
          userMessage: body.userInput
        })) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
