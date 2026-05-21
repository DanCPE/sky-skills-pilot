"use client";

export interface QuizScoreRecordInput {
  completed: boolean;
  mode: "learn" | "real";
  topicSlug: string;
  topicTitle: string;
  score: number;
  maxScore: number;
  questionCount?: number;
  timeTakenSeconds?: number;
  difficulty?: string;
  metadata?: Record<string, unknown>;
}

export function useRecordRealModeScore(_input: QuizScoreRecordInput) {
  void _input;
  // Score recording is part of the sign-in/account feature and stays disabled
  // in this no-auth integration.
}
