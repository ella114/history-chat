import { HistoricalFootnote, Persona } from "@/lib/types";

function getLeadSentence(text: string) {
  const normalized = text.trim();
  const match = normalized.match(/^.+?[。！？]/);

  return match?.[0] ?? normalized;
}

function getReadingBoundary(persona: Persona) {
  const boundary = persona.safetyBoundary[0];

  if (boundary) {
    return boundary;
  }

  return "回答会保留人物边界与历史分寸。";
}

export function buildHistoricalFootnotes(persona: Persona): HistoricalFootnote[] {
  return [
    {
      title: "时代位置",
      content: `${persona.name}所处的主要历史语境是${persona.era}，这场对话会尽量从这一时期的问题意识与经验出发。`
    },
    {
      title: "人物线索",
      content: `${getLeadSentence(persona.longBio)} 这也是当前回答最容易回到的判断尺度。`
    },
    {
      title: "阅读提示",
      content: `${persona.disclaimer} 当前尤其强调：${getReadingBoundary(persona)}`
    }
  ];
}
