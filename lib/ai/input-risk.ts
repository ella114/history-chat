import { ModerationResult } from "@/lib/types";

export type InputRiskLevel = "safe" | "unsafe" | "uncertain";

export interface InputRiskAssessment {
  level: InputRiskLevel;
  moderation: ModerationResult;
}

const hardBlockPatterns = [
  /(自杀|轻生|结束生命|炸药|爆炸装置|制毒|枪支改造|袭击|投毒|人体实验)/i,
  /(如何(杀|炸|制毒|投毒|伤害|报复|袭击))/i
];

const moderationPatterns = [
  /(枪|刀|毒|炸|血|尸|死|杀|自残|割腕|上吊|勒死|迷药|强奸|未成年|色情)/i,
  /(黑客|破解|木马|勒索|诈骗|洗钱|跟踪|窃听|仇恨|报复|暴力)/i
];

export function assessInputRisk(message: string): InputRiskAssessment {
  if (hardBlockPatterns.some((pattern) => pattern.test(message))) {
    return {
      level: "unsafe",
      moderation: {
        flagged: true,
        reason: "命中本地高风险规则",
        safeReply:
          "这个方向我不能继续具体展开。如果你愿意，我们可以换成更安全的背景、风险或求助方式。"
      }
    };
  }

  if (moderationPatterns.some((pattern) => pattern.test(message))) {
    return {
      level: "uncertain",
      moderation: {
        flagged: false,
        reason: "命中本地灰区规则，需进一步审核"
      }
    };
  }

  return {
    level: "safe",
    moderation: {
      flagged: false,
      reason: "本地低风险直通"
    }
  };
}
