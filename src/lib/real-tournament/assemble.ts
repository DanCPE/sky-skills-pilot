import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  MIXED_ROUND_DIFFICULTY_PLAN,
  ROUND_INTRO_AUTO_START_SECONDS,
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
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

function getTournamentWeekId() {
  const weekIndex = Math.floor(Date.now() / WEEK_MS);
  return `week-${weekIndex}`;
}

function getWeeklyTopic(categoryIndex: number, candidates: string[]) {
  const weekIndex = Math.floor(Date.now() / WEEK_MS);
  return candidates[(weekIndex + categoryIndex) % candidates.length];
}

function buildAdapterRound(
  adapter: (typeof tournamentAdapters)[number],
): {
  questions: TournamentQuestionInternal[];
  briefingText?: string | null;
} {
  if (adapter.generateRound) {
    return adapter.generateRound(ROUND_QUESTION_COUNT);
  }

  return {
    questions: MIXED_ROUND_DIFFICULTY_PLAN.flatMap((entry) =>
      adapter.generate(entry.difficulty, entry.count),
    ).slice(0, ROUND_QUESTION_COUNT),
  };
}

export async function assembleRealTournamentQuestions() {
  const selectedRounds = TOURNAMENT_CATEGORIES.map((category, categoryIndex) => {
    const selectedTopic = getWeeklyTopic(categoryIndex, category.candidates);
    const adapter = tournamentAdapters.find((item) => item.topic === selectedTopic);

    if (!adapter) {
      throw new Error(`Tournament adapter not found for ${selectedTopic}.`);
    }

    const round = buildAdapterRound(adapter);
    const questions = shuffle(round.questions).slice(0, ROUND_QUESTION_COUNT);

    if (questions.length !== ROUND_QUESTION_COUNT) {
      throw new Error(`${adapter.title} did not generate 10 questions.`);
    }

    const id = `${category.category}-${adapter.topic}`;
    return {
      id,
      category: category.category,
      categoryLabel: category.label,
      topic: adapter.topic,
      title: adapter.title,
      questionCount: ROUND_QUESTION_COUNT,
      timeLimitSeconds: adapter.timeLimitSeconds,
      introAutoStartSeconds: ROUND_INTRO_AUTO_START_SECONDS,
      briefingText: round.briefingText ?? null,
      questions,
    };
  });

  if (selectedRounds.length !== TOURNAMENT_CATEGORIES.length) {
    throw new Error("Tournament did not generate all category rounds.");
  }

  const answerKey: TournamentAnswerKey = {
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
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
    tournamentWeekId: getTournamentWeekId(),
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
