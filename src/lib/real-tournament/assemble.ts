import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  getRealTournamentWeekTiming,
  MIXED_ROUND_DIFFICULTY_PLAN,
  REAL_TOURNAMENT_TIMING,
  ROUND_QUESTION_COUNT,
  TOURNAMENT_CATEGORIES,
} from "./config";
import { tournamentAdapters } from "./adapters";
import type {
  TournamentAnswerKey,
  TournamentQuestionDisplay,
  TournamentQuestionInternal,
  TournamentRoundDisplay,
} from "./types";

const TOKEN_VERSION = "v1";

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getSigningSecret() {
  return (
    process.env.REAL_TOURNAMENT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "local-real-tournament-development-secret"
  );
}

function getEncryptionKey() {
  return createHash("sha256").update(getSigningSecret()).digest();
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

function toDisplayQuestion(
  question: TournamentQuestionInternal,
): TournamentQuestionDisplay {
  return {
    id: question.id,
    sourceTopic: question.sourceTopic,
    sourceTitle: question.sourceTitle,
    prompt: question.prompt,
    kind: question.kind,
    difficulty: question.difficulty,
    options: question.options,
    detail: question.detail,
  };
}

function getWeeklyTopic(categoryIndex: number, candidates: string[]) {
  const { weekIndex } = getRealTournamentWeekTiming();
  return candidates[(weekIndex + categoryIndex) % candidates.length];
}

function buildAdapterRound(
  adapter: (typeof tournamentAdapters)[number],
): {
  questions: TournamentQuestionInternal[];
  briefingText?: string | null;
  readingDurationSeconds?: number;
} {
  if (adapter.generateRound) {
    return adapter.generateRound({
      questionCount: ROUND_QUESTION_COUNT,
      passageReadingSeconds: REAL_TOURNAMENT_TIMING.passageReadingSeconds,
    });
  }

  return {
    questions: MIXED_ROUND_DIFFICULTY_PLAN.flatMap((entry) =>
      adapter.generate(entry.difficulty, entry.count),
    ),
  };
}

function getRoundTimeLimitSeconds(
  adapter: (typeof tournamentAdapters)[number],
  questionCount: number,
) {
  if (adapter.timeLimitSeconds !== undefined) {
    return adapter.timeLimitSeconds;
  }

  if (adapter.secondsPerQuestion !== undefined) {
    return questionCount * adapter.secondsPerQuestion;
  }

  throw new Error(`${adapter.title} is missing tournament timing config.`);
}

export async function assembleRealTournamentQuestions(input: {
  accountId: string;
  attemptId: string;
}) {
  const weekTiming = getRealTournamentWeekTiming();
  const selectedRounds = TOURNAMENT_CATEGORIES.map((category, categoryIndex) => {
    const selectedTopic = getWeeklyTopic(categoryIndex, category.candidates);
    const adapter = tournamentAdapters.find((item) => item.topic === selectedTopic);

    if (!adapter) {
      throw new Error(`Tournament adapter not found for ${selectedTopic}.`);
    }

    const round = buildAdapterRound(adapter);
    const questions = shuffle(round.questions).slice(0, ROUND_QUESTION_COUNT);

    if (questions.length !== ROUND_QUESTION_COUNT) {
      throw new Error(
        `${adapter.title} did not generate ${ROUND_QUESTION_COUNT} questions.`,
      );
    }

    const id = `${category.category}-${adapter.topic}`;
    return {
      id,
      category: category.category,
      categoryLabel: category.label,
      topic: adapter.topic,
      title: adapter.title,
      timeLimitSeconds: getRoundTimeLimitSeconds(adapter, questions.length),
      secondsPerQuestion: adapter.secondsPerQuestion,
      introAutoStartSeconds: REAL_TOURNAMENT_TIMING.roundIntroAutoStartSeconds,
      readingDurationSeconds: round.readingDurationSeconds,
      briefingText: round.briefingText ?? null,
      questions,
    };
  });

  if (selectedRounds.length !== TOURNAMENT_CATEGORIES.length) {
    throw new Error("Tournament did not generate all category rounds.");
  }

  const answerKey: TournamentAnswerKey = {
    accountId: input.accountId,
    attemptId: input.attemptId,
    weekId: weekTiming.weekId,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(
      Date.now() + REAL_TOURNAMENT_TIMING.tokenTtlSeconds * 1000,
    ).toISOString(),
    questions: selectedRounds.flatMap((round) =>
      round.questions.map((question) => ({
        id: question.id,
        sourceTopic: question.sourceTopic,
        roundId: round.id,
        difficulty: question.difficulty,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      })),
    ),
  };

  const displayRounds: TournamentRoundDisplay[] = selectedRounds.map((round) => ({
    ...round,
    questions: round.questions.map(toDisplayQuestion),
  }));

  return {
    tournamentWeekId: weekTiming.weekId,
    rounds: displayRounds,
    answerToken: createAnswerToken(answerKey),
  };
}

export function createAnswerToken(answerKey: TournamentAnswerKey) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(answerKey), "utf8"),
    cipher.final(),
  ]);
  const payload = [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");

  return `${TOKEN_VERSION}.${payload}.${signPayload(payload)}`;
}

export function verifyAnswerToken(token: string): TournamentAnswerKey | null {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== TOKEN_VERSION) return null;

  const [, ivText, authTagText, encryptedText, signature] = parts;
  const payload = [ivText, authTagText, encryptedText].join(".");
  const expected = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagText, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(
      decrypted,
    ) as TournamentAnswerKey;

    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
