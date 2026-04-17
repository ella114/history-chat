import { notFound } from "next/navigation";

import { ChatShell } from "@/components/chat/chat-shell";
import { personaMap, personas } from "@/lib/data/personas";

export function generateStaticParams() {
  return personas.map((persona) => ({
    slug: persona.slug
  }));
}

export default function ChatPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { conversation?: string };
}) {
  const persona = personaMap.get(params.slug);

  if (!persona) {
    notFound();
  }

  const conversationId =
    typeof searchParams.conversation === "string"
      ? searchParams.conversation
      : undefined;

  return <ChatShell persona={persona} conversationId={conversationId} />;
}
