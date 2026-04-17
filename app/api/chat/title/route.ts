import { NextRequest, NextResponse } from "next/server";

import { getAiProvider } from "@/lib/ai";
import { parseChatTitleApiRequest } from "@/lib/api/request-validation";
import { personaIdMap } from "@/lib/data/personas";
import { ChatTitleApiResponse } from "@/lib/types";

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

  const body = parseChatTitleApiRequest(payload);

  if (!body) {
    return jsonError("请求参数不合法。");
  }

  const persona = personaIdMap.get(body.personaId);

  if (!persona) {
    return jsonError("人物不存在。", 404);
  }

  const provider = getAiProvider();
  const titleSuggestion = await provider.generateConversationTitle({
    persona,
    messages: body.messages
  });

  const response: ChatTitleApiResponse = {
    titleSuggestion
  };

  return NextResponse.json(response);
}
