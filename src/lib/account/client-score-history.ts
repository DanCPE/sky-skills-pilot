"use client";

import { useEffect, useRef } from "react";

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

export function useRecordRealModeScore(input: QuizScoreRecordInput) {
  const recordedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !input.completed ||
      input.mode !== "real" ||
      input.maxScore <= 0 ||
      input.timeTakenSeconds === undefined
    ) {
      return;
    }

    const recordKey = [
      input.topicSlug,
      input.score,
      input.maxScore,
      input.questionCount ?? "",
      input.timeTakenSeconds ?? "",
    ].join(":");

    if (recordedKeyRef.current === recordKey) {
      return;
    }

    recordedKeyRef.current = recordKey;

    void fetch("/api/account/scores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topicSlug: input.topicSlug,
        topicTitle: input.topicTitle,
        score: input.score,
        maxScore: input.maxScore,
        mode: input.mode,
        difficulty: input.difficulty,
        questionCount: input.questionCount ?? input.maxScore,
        timeTakenSeconds: input.timeTakenSeconds,
        metadata: input.metadata,
      }),
    }).catch(() => {
      recordedKeyRef.current = null;
    });
  }, [
    input.completed,
    input.difficulty,
    input.maxScore,
    input.metadata,
    input.mode,
    input.questionCount,
    input.score,
    input.timeTakenSeconds,
    input.topicSlug,
    input.topicTitle,
  ]);
}
