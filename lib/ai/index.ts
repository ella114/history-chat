import { MockAiProvider } from "@/lib/ai/providers/mock-provider";
import { OpenAiProvider } from "@/lib/ai/providers/openai-provider";
import { AiProvider } from "@/lib/ai/provider";

const providerRegistry: Record<string, AiProvider> = {
  mock: new MockAiProvider(),
  openai: new OpenAiProvider()
};

export function getAiProvider() {
  const requestedProvider = process.env.AI_PROVIDER?.trim();
  const key =
    requestedProvider ??
    (process.env.OPENAI_API_KEY ? "openai" : "mock");
  const provider = providerRegistry[key] ?? providerRegistry.mock;

  console.info("[ai] provider selection", {
    requestedProvider: process.env.AI_PROVIDER ?? null,
    normalizedProvider: requestedProvider ?? null,
    resolvedProvider: provider === providerRegistry.openai ? "openai" : "mock",
    hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY)
  });

  return provider;
}
