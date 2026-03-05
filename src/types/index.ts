export interface Topic {
  slug: string;
  icon: string;
  title: string;
  description: string;
  category: TopicCategory;
}

export type TopicCategory = "scanning" | "logical" | "spatial" | "approximation" | "short-term-memory";

export interface Question {
  id: string;
  prompt: string;
  options?: string[];
}

export interface SubmitPayload {
  questionId: string;
  answer: string;
}

export interface SubmitResult {
  correct: boolean;
  explanation?: string;
}
