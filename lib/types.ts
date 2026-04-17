export type PersonaCategory = "哲学" | "文学" | "政治" | "科学" | "军事" | "宗教";
export type PersonaRoleCategory =
  | "政治人物"
  | "军事人物"
  | "思想家"
  | "文学家"
  | "科学家"
  | "宗教人物"
  | "改革家";
export type PersonaStatus = "active" | "draft";
export type MessageRole = "user" | "assistant" | "system";
export type FeedbackType =
  | "like"
  | "unlike"
  | "off_topic"
  | "too_generic"
  | "too_modern";

export interface PersonaConfig {
  voice: string;
  worldview: string;
  responseStyle: string[];
  temporalLens: string;
  dos: string[];
  donts: string[];
}

export interface Persona {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  era: string;
  roleCategory: PersonaRoleCategory;
  category: PersonaCategory;
  shortBio: string;
  longBio: string;
  styleKeywords: string[];
  suggestedQuestions: string[];
  disclaimer: string;
  personaConfig: PersonaConfig;
  safetyBoundary: string[];
  systemPrompt: string;
  status: PersonaStatus;
}

export interface PersonaRoleCategoryMeta {
  slug: string;
  label: PersonaRoleCategory;
  shortDescription: string;
  longDescription: string;
}

export interface Conversation {
  id: string;
  userId: string | null;
  personaId: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  messageId: string;
  personaId: string;
  type: FeedbackType;
  createdAt: string;
}

export interface HistoricalFootnote {
  title: string;
  content: string;
}

export interface SavedQuote {
  id: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  personaId: string;
  personaName: string;
  content: string;
  footnotes: HistoricalFootnote[];
  createdAt: string;
}

export interface ConversationThread {
  conversation: Conversation;
  messages: Message[];
  feedback: Feedback[];
}

export interface ConversationContext {
  title?: string;
  summary?: string;
  recentMessages: Message[];
}

export interface ModerateInputParams {
  persona: Persona;
  message: string;
}

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  safeReply?: string;
}

export interface GenerateReplyParams {
  persona: Persona;
  conversation: Pick<Conversation, "title" | "summary"> | null;
  context: ConversationContext;
  userMessage: string;
}

export interface GenerateReplyResult {
  content: string;
  caution?: string;
}

export interface GenerateTitleParams {
  persona: Persona;
  messages: Message[];
}

export interface GenerateTitleResult {
  title: string;
  summary: string;
}

export interface ChatApiRequest {
  personaId: string;
  conversation: Pick<Conversation, "title" | "summary"> | null;
  messages: Message[];
  userInput: string;
}

export interface ChatApiResponse {
  moderation: ModerationResult;
  reply: GenerateReplyResult;
  titleSuggestion?: GenerateTitleResult;
}

export interface ChatTitleApiRequest {
  personaId: string;
  messages: Message[];
}

export interface ChatTitleApiResponse {
  titleSuggestion: GenerateTitleResult;
}

export interface LocalDatabase {
  conversations: Conversation[];
  messages: Message[];
  feedback: Feedback[];
  savedQuotes: SavedQuote[];
}
