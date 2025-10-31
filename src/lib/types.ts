export type Source = {
  id: number;
  url: string;
  title: string;
};

export type UserMessage = {
  id: string;
  role: 'user';
  content: string;
};

export type AssistantMessage = {
  id: string;
  role: 'assistant';
  content: string;
  sources: Source[];
  traceStep: string | null;
};

export type ChatMessage = UserMessage | AssistantMessage;
