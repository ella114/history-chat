import {
  GenerateReplyParams,
  GenerateReplyResult,
  GenerateTitleParams,
  GenerateTitleResult,
  ModerateInputParams,
  ModerationResult
} from "@/lib/types";

export interface AiProvider {
  moderateInput(params: ModerateInputParams): Promise<ModerationResult>;
  generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult>;
  streamReply(params: GenerateReplyParams): AsyncIterable<string>;
  generateConversationTitle(params: GenerateTitleParams): Promise<GenerateTitleResult>;
}
