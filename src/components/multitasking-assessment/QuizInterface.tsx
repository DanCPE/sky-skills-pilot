"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Timer from "@/components/shared/Timer";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  MultitaskingAssessmentConfig,
  MultitaskingAssessmentResult,
} from "@/types";

type EventKind = "hit" | "miss" | "fault" | "info";
type AssessmentEvent = MultitaskingAssessmentResult["eventLog"][number];
type Direction = "up" | "down";
type VoiceStatus =
  | "idle"
  | "speaking"
  | "thinking"
  | "listening"
  | "correct"
  | "missed"
  | "unsupported";

interface MatbVoiceRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface MatbVoiceRecognitionErrorEvent extends Event {
  error?: string;
}

interface MatbVoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: MatbVoiceRecognitionEvent) => void) | null;
  onerror: ((event: MatbVoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface MatbVoiceRecognitionConstructor {
  new (): MatbVoiceRecognition;
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
  };
};

interface QuizInterfaceProps {
  config: MultitaskingAssessmentConfig;
  onRestart: () => void;
}

interface DifficultySettings {
  signalEveryMs: [number, number];
  signalTimeoutMs: number;
  gaugeSpeed: number;
  mathMax: number;
}

interface MathQuestion {
  id: string;
  a: number;
  b: number;
  operator: "+" | "-" | "×" | "÷";
  answer: number;
  difficulty: "easy" | "medium" | "hard";
}

interface VoiceQuestion {
  prompt: string;
  answer: number;
}

const digitWords: Record<string, number> = {
  zero: 0,
  oh: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
};

interface ActiveSignal {
  lightIndex: number;
  position: string;
  expiresAt: number;
  actionable: boolean;
}

const difficultySettings: Record<string, DifficultySettings> = {
  easy: {
    signalEveryMs: [6500, 10500],
    signalTimeoutMs: 6500,
    gaugeSpeed: 4.2,
    mathMax: 12,
  },
  medium: {
    signalEveryMs: [4600, 8200],
    signalTimeoutMs: 5200,
    gaugeSpeed: 5.8,
    mathMax: 24,
  },
  hard: {
    signalEveryMs: [3200, 6500],
    signalTimeoutMs: 4200,
    gaugeSpeed: 7.4,
    mathMax: 40,
  },
};

const rows = "ABCDEFGHIJ".split("");
const columns = Array.from({ length: 10 }, (_, index) => index + 1);
const greenLow = 50;
const greenHigh = 70;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

function expectedGreenSignalsForRun(
  settings: DifficultySettings,
  durationSeconds: number,
) {
  const averageSignalMs = (settings.signalEveryMs[0] + settings.signalEveryMs[1]) / 2;
  const expectedSignals = (durationSeconds * 1000) / averageSignalMs;
  return Math.max(1, Math.floor(expectedSignals * 0.66));
}

function expectedSystemFaultsForRun(durationSeconds: number) {
  return Math.max(1, Math.floor(durationSeconds / 10));
}

function expectedVoiceQuestionsForRun(durationSeconds: number) {
  return Math.max(1, Math.floor(durationSeconds / 9));
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function makeMathQuestion(
  id: string,
  difficulty: "easy" | "medium" | "hard",
): MathQuestion {
  if (difficulty === "easy") {
    const a = Math.floor(100 + Math.random() * 900);
    const b = Math.floor(100 + Math.random() * 900);
    const operator = Math.random() > 0.5 ? "+" : "-";
    return {
      id,
      a,
      b,
      operator,
      answer: operator === "+" ? a + b : a - b,
      difficulty,
    };
  }

  const useDivision = difficulty === "hard" ? Math.random() < 0.55 : Math.random() < 0.35;
  if (useDivision) {
    const divisor =
      difficulty === "hard"
        ? Math.floor(2 + Math.random() * 98)
        : Math.floor(2 + Math.random() * 18);
    const quotient =
      difficulty === "hard"
        ? Math.floor(12 + Math.random() * 88)
        : Math.floor(4 + Math.random() * 46);
    return {
      id,
      a: divisor * quotient,
      b: divisor,
      operator: "÷",
      answer: quotient,
      difficulty,
    };
  }

  const a =
    difficulty === "hard"
      ? Math.floor(20 + Math.random() * 80)
      : Math.floor(10 + Math.random() * 90);
  const b =
    difficulty === "hard"
      ? Math.floor(10 + Math.random() * 90)
      : Math.floor(2 + Math.random() * 18);
  return {
    id,
    a,
    b,
    operator: "×",
    answer: a * b,
    difficulty,
  };
}

function makeMathQuestionSet() {
  const difficulties: Array<"easy" | "medium" | "hard"> = [
    "easy",
    "easy",
    "easy",
    "medium",
    "medium",
    "medium",
    "hard",
    "hard",
    "hard",
    "easy",
    "medium",
    "hard",
  ];
  return difficulties.map((difficulty, index) =>
    makeMathQuestion(`math-${index + 1}`, difficulty),
  );
}

function makeVoiceQuestion(): VoiceQuestion {
  const questionType = Math.random();
  if (questionType < 0.38) {
    const length = Math.random() > 0.5 ? 4 : 3;
    const digits = Array.from({ length }, (_, index) =>
      index === 0
        ? Math.floor(1 + Math.random() * 9)
        : Math.floor(Math.random() * 10),
    );
    return {
      prompt: `Read back ${digits.join(" ")}`,
      answer: Number(digits.join("")),
    };
  }
  if (questionType < 0.62) {
    const a = Math.floor(2 + Math.random() * 8);
    const b = Math.floor(2 + Math.random() * 8);
    return {
      prompt: `${a} times ${b}`,
      answer: a * b,
    };
  }
  const a = Math.floor(11 + Math.random() * 39);
  const b = Math.floor(2 + Math.random() * 18);
  const operator = Math.random() > 0.5 ? "+" : "-";
  return {
    prompt: `${a} ${operator === "+" ? "plus" : "minus"} ${b}`,
    answer: operator === "+" ? a + b : a - b,
  };
}

function parseSpokenNumber(transcript: string) {
  const normalized = transcript.toLowerCase().replace(/[^a-z0-9-\s]/g, " ");
  const numeric = normalized.match(/-?\d+/);
  if (numeric) return Number(numeric[0]);

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const digitTokens = tokens
    .map((token) => digitWords[token])
    .filter((value): value is number => value !== undefined);
  if (digitTokens.length >= 3 && digitTokens.length === tokens.length) {
    return Number(digitTokens.join(""));
  }

  const words: Record<string, number> = {
    ...digitWords,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };
  let total = 0;
  let matched = false;
  let sign = 1;
  for (const token of tokens) {
    if (token === "negative" || token === "minus") {
      sign = -1;
      continue;
    }
    if (words[token] !== undefined) {
      total += words[token];
      matched = true;
    }
  }
  return matched ? total * sign : null;
}

function getVoiceRecognitionBrowserWarning() {
  if (typeof navigator === "undefined") return null;
  const userAgent = navigator.userAgent;
  const brands = (navigator as NavigatorWithUserAgentData).userAgentData?.brands;
  const vendor = navigator.vendor;
  const isEdge = /\bEdg\//.test(userAgent);
  const isOpera = /\b(OPR|Opera)\//.test(userAgent);
  const isSafari =
    vendor === "Apple Computer, Inc." &&
    /\bSafari\//.test(userAgent) &&
    !/\b(Chrome|CriOS|Chromium|Edg|OPR|Opera|Arc)\//.test(userAgent);
  const hasGoogleChromeBrand =
    brands?.some((brand) => brand.brand === "Google Chrome") ?? false;
  const isGoogleChrome = brands
    ? hasGoogleChromeBrand && !isEdge && !isOpera
    : /\bChrome\//.test(userAgent) &&
      vendor === "Google Inc." &&
      !isEdge &&
      !isOpera &&
      !/\bArc\//.test(userAgent);

  if (isEdge) {
    return "Voice input needs Google Chrome. Microsoft Edge exposes speech recognition but fails with a network error because it does not use Google's speech backend.";
  }

  if (!isGoogleChrome && !isSafari) {
    return "Voice input is supported only in Google Chrome or Safari. Please open this quest in Chrome or Safari; Edge, Arc, and other Chromium browsers may expose speech recognition but fail before returning text.";
  }

  return null;
}

function randomGridPosition() {
  const row = rows[Math.floor(Math.random() * rows.length)];
  const column = columns[Math.floor(Math.random() * columns.length)];
  return `${row}-${column}`;
}

function gaugeState(value: number): "high" | "low" | "safe" {
  if (value > greenHigh) return "high";
  if (value < greenLow) return "low";
  return "safe";
}

function makeGaugePlan(now: number, baseSpeed: number) {
  return {
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    speed: baseSpeed * (0.38 + Math.random() * 1.15),
    nextChangeAt: now + 650 + Math.random() * 1850,
    pauseUntil: 0,
  };
}

export default function QuizInterface({ config, onRestart }: QuizInterfaceProps) {
  const settings = difficultySettings[config.difficulty];
  const hasMathTask = config.assessmentMode === "full";
  const hasVoiceTask = config.assessmentMode !== "core2";
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [finalResult, setFinalResult] =
    useState<MultitaskingAssessmentResult | null>(null);
  const [systemGauge, setSystemGauge] = useState(60);
  const [activeSignal, setActiveSignal] = useState<ActiveSignal | null>(null);
  const [clickedCells, setClickedCells] = useState<Set<string>>(() => new Set());
  const [mathQuestions, setMathQuestions] = useState<MathQuestion[]>([]);
  const [mathAnswers, setMathAnswers] = useState<Record<string, string>>({});
  const [voiceQuestion, setVoiceQuestion] = useState<VoiceQuestion | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceAnswerText, setVoiceAnswerText] = useState("");

  const startedAtRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<MatbVoiceRecognition | null>(null);
  const queueVoiceQuestionRef = useRef<() => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});
  const stopListeningRef = useRef<() => void>(() => {});
  const voiceKeyHeldRef = useRef(false);
  const gaugeDirectionRef = useRef<1 | -1>(1);
  const systemFaultActiveRef = useRef(false);
  const gaugePlanRef = useRef(makeGaugePlan(0, settings.gaugeSpeed));
  const nextSignalAtRef = useRef(0);
  const activeSignalRef = useRef<ActiveSignal | null>(null);
  const allEventsRef = useRef<AssessmentEvent[]>([]);
  const clickedCellsRef = useRef<Set<string>>(new Set());
  const requestedCellsRef = useRef<Set<string>>(new Set());
  const mathQuestionsRef = useRef<MathQuestion[]>([]);
  const mathAnswersRef = useRef<Record<string, string>>({});
  const voiceQuestionRef = useRef<VoiceQuestion | null>(null);
  const metricsRef = useRef({
    systemFaults: 0,
    systemAcknowledgements: 0,
    systemMisses: 0,
    systemAttempts: 0,
    systemWrongCorrections: 0,
    gaugeOutOfBandSeconds: 0,
    gridHits: 0,
    gridMisses: 0,
    gridFalseAlarms: 0,
    gridWrongCellClicks: 0,
    gridDistractorClicks: 0,
    gridSignals: 0,
    gridDistractors: 0,
    mathQuestions: 0,
    mathCorrect: 0,
    mathIncorrect: 0,
    mathAnswered: 0,
    voiceQuestions: 0,
    voiceCorrect: 0,
    voiceIncorrect: 0,
    voiceMissed: 0,
    voiceUnsupported: false,
  });

  const logVoiceDebug = useCallback((message: string, data?: unknown) => {
    if (data === undefined) {
      console.debug("[MATB voice]", message);
    } else {
      console.debug("[MATB voice]", message, data);
    }
  }, []);

  useEffect(() => {
    activeSignalRef.current = activeSignal;
  }, [activeSignal]);

  useEffect(() => {
    clickedCellsRef.current = clickedCells;
  }, [clickedCells]);

  useEffect(() => {
    mathQuestionsRef.current = mathQuestions;
  }, [mathQuestions]);

  useEffect(() => {
    mathAnswersRef.current = mathAnswers;
  }, [mathAnswers]);

  useEffect(() => {
    voiceQuestionRef.current = voiceQuestion;
  }, [voiceQuestion]);

  const pushEvent = useCallback(
    (task: string, messageText: string, kind: EventKind) => {
      const elapsedSeconds = startedAtRef.current
        ? (performance.now() - startedAtRef.current) / 1000
        : 0;
      const entry = {
        elapsedSeconds,
        task,
        message: messageText,
        kind,
      };
      allEventsRef.current = [entry, ...allEventsRef.current];
    },
    [],
  );

  const clearVoiceTimer = useCallback(() => {
    if (voiceTimerRef.current) {
      logVoiceDebug("clear pending voice timer");
      clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
  }, [logVoiceDebug]);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      logVoiceDebug("abort active recognition");
      recognitionRef.current.abort();
    }
    recognitionRef.current = null;
  }, [logVoiceDebug]);

  const queueVoiceQuestion = useCallback(() => {
    logVoiceDebug("queue voice question requested");
    if (typeof window === "undefined") {
      logVoiceDebug("window unavailable");
      return;
    }
    clearVoiceTimer();
    stopVoiceRecognition();

    const speechWindow = window as Window & {
      SpeechRecognition?: MatbVoiceRecognitionConstructor;
      webkitSpeechRecognition?: MatbVoiceRecognitionConstructor;
    };
    const Recognition = (speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition) as
      | MatbVoiceRecognitionConstructor
      | undefined;
    const browserWarning = getVoiceRecognitionBrowserWarning();
    logVoiceDebug("voice support check", {
      hasSpeechSynthesis: Boolean(window.speechSynthesis),
      hasRecognition: Boolean(Recognition),
      browserWarning,
      protocol: window.location.protocol,
      host: window.location.host,
    });
    if (browserWarning) {
      metricsRef.current.voiceUnsupported = true;
      setVoiceEnabled(false);
      setVoiceStatus("unsupported");
      setVoiceQuestion(null);
      setVoiceAnswerText(browserWarning);
      logVoiceDebug("voice browser unsupported", { browserWarning });
      return;
    }
    if (!Recognition || !window.speechSynthesis) {
      metricsRef.current.voiceUnsupported = true;
      setVoiceEnabled(false);
      setVoiceStatus("unsupported");
      setVoiceAnswerText("Voice input is unavailable in this browser.");
      logVoiceDebug("voice unsupported");
      return;
    }

    const question = makeVoiceQuestion();
    voiceQuestionRef.current = question;
    metricsRef.current.voiceQuestions += 1;
    setVoiceQuestion(question);
    setVoiceAnswerText("");
    setVoiceStatus("speaking");
    logVoiceDebug("created voice question", question);

    const utterance = new SpeechSynthesisUtterance(question.prompt);
    utterance.lang = "en-US";
    utterance.rate = 0.92;

    const startListening = async () => {
      logVoiceDebug("startListening called");
      if (recognitionRef.current) return;
      clearVoiceTimer();
      stopVoiceRecognition();
      const recognition = new Recognition();
      let latestTranscript = "";
      let completed = false;

      const scheduleNextVoiceQuestion = (delayMs: number) => {
        voiceTimerRef.current = setTimeout(
          () => queueVoiceQuestionRef.current(),
          delayMs,
        );
      };

      const finishVoiceAttempt = (transcript: string, source: string) => {
        if (completed) return;
        completed = true;
        clearVoiceTimer();
        const value = parseSpokenNumber(transcript);
        setVoiceAnswerText(value === null ? transcript : String(value));
        recognitionRef.current = null;
        try {
          recognition.abort();
        } catch {
          // Recognition can already be ended after push-to-talk release.
        }
        if (value === question.answer) {
          metricsRef.current.voiceCorrect += 1;
          setVoiceStatus("correct");
          pushEvent("Voice", `${question.prompt} answered correctly`, "hit");
        } else {
          metricsRef.current.voiceIncorrect += 1;
          setVoiceStatus("missed");
          pushEvent(
            "Voice",
            `${question.prompt} heard "${transcript}" via ${source}`,
            "miss",
          );
        }
        scheduleNextVoiceQuestion(1200);
      };

      const missVoiceAttempt = (messageText: string, delayMs = 1200) => {
        if (completed) return;
        completed = true;
        clearVoiceTimer();
        recognitionRef.current = null;
        metricsRef.current.voiceMissed += 1;
        setVoiceStatus("missed");
        setVoiceAnswerText(messageText);
        pushEvent("Voice", `${question.prompt} ${messageText}`, "miss");
        scheduleNextVoiceQuestion(delayMs);
      };

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => {
        logVoiceDebug("recognition onstart");
      };
      recognition.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1]?.[0]?.transcript ?? "";
        const value = parseSpokenNumber(transcript);
        const isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
        latestTranscript = transcript;
        logVoiceDebug("recognition result", {
          transcript,
          value,
          isFinal,
          resultCount: event.results.length,
        });
        setVoiceAnswerText(value === null ? transcript : String(value));
        if (!isFinal) return;
        finishVoiceAttempt(transcript, "final result");
      };
      recognition.onerror = (event) => {
        if (completed) return;
        logVoiceDebug("recognition error", event.error ?? "unknown");
        clearVoiceTimer();
        recognitionRef.current = null;
        completed = true;
        if (event.error === "network") {
          metricsRef.current.voiceUnsupported = true;
          setVoiceEnabled(false);
          setVoiceStatus("unsupported");
          setVoiceAnswerText(
            "Voice recognition failed with a network error. Use Chrome or Safari, or switch this task to server-side speech-to-text.",
          );
          pushEvent("Voice", "Voice recognition network error", "miss");
          return;
        }
        metricsRef.current.voiceMissed += 1;
        setVoiceStatus("missed");
        setVoiceAnswerText("No voice captured");
        pushEvent("Voice", `${question.prompt} not captured`, "miss");
        scheduleNextVoiceQuestion(1200);
      };
      recognition.onend = () => {
        logVoiceDebug("recognition onend", {
          stillCurrent: recognitionRef.current === recognition,
        });
        if (!completed) {
          if (latestTranscript.trim()) {
            finishVoiceAttempt(latestTranscript, "release");
          } else {
            missVoiceAttempt("not captured");
          }
          return;
        }
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };
      recognitionRef.current = recognition;
      setVoiceStatus("listening");
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          logVoiceDebug("request mic permission");
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          logVoiceDebug("mic permission granted");
          stream.getTracks().forEach((track) => track.stop());
        } else {
          logVoiceDebug("getUserMedia unavailable");
        }
        logVoiceDebug("cancel speech before recognition.start");
        window.speechSynthesis?.cancel();
        logVoiceDebug("calling recognition.start");
        recognition.start();
        voiceTimerRef.current = setTimeout(() => {
          logVoiceDebug("recognition timeout");
          missVoiceAttempt("timed out", 900);
          recognition.abort();
        }, 7000);
      } catch (error) {
        logVoiceDebug("mic permission or recognition.start failed", error);
        missVoiceAttempt("Mic could not start");
      }
    };

    startListeningRef.current = () => {
      void startListening();
    };
    stopListeningRef.current = () => {
      const recognition = recognitionRef.current;
      if (!recognition) return;
      logVoiceDebug("push-to-talk released");
      try {
        recognition.stop();
      } catch {
        recognition.abort();
        recognitionRef.current = null;
      }
    };

    const scheduleListening = () => {
      logVoiceDebug("schedule listening after speech");
      setVoiceStatus("thinking");
      const waitForSpeechToFinish = () => {
        logVoiceDebug("speech quiet check", {
          speaking: window.speechSynthesis.speaking,
          pending: window.speechSynthesis.pending,
        });
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          voiceTimerRef.current = setTimeout(waitForSpeechToFinish, 250);
          return;
        }
        logVoiceDebug("speech quiet, waiting for B hold");
        setVoiceStatus("thinking");
      };
      waitForSpeechToFinish();
    };

    let speechSettled = false;
    const settleSpeech = (source: string) => {
      if (speechSettled) return;
      speechSettled = true;
      logVoiceDebug(`speech settled by ${source}`);
      clearVoiceTimer();
      scheduleListening();
    };

    utterance.onstart = () => {
      logVoiceDebug("speech utterance onstart", question.prompt);
    };
    utterance.onend = () => {
      logVoiceDebug("speech utterance onend");
      settleSpeech("onend");
    };
    utterance.onerror = (event) => {
      logVoiceDebug("speech utterance error", event);
      settleSpeech("onerror");
    };

    logVoiceDebug("speechSynthesis.cancel before speak");
    window.speechSynthesis.cancel();
    logVoiceDebug("speechSynthesis.resume before speak");
    window.speechSynthesis.resume();
    logVoiceDebug("speechSynthesis.speak", question.prompt);
    window.speechSynthesis.speak(utterance);
    const speechWatchdogDelay = Math.max(
      2500,
      question.prompt.length * 110 + 1200,
    );
    voiceTimerRef.current = setTimeout(() => {
      logVoiceDebug("speech watchdog fired", {
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending,
      });
      settleSpeech("watchdog");
    }, speechWatchdogDelay);
  }, [clearVoiceTimer, logVoiceDebug, pushEvent, stopVoiceRecognition]);

  useEffect(() => {
    queueVoiceQuestionRef.current = queueVoiceQuestion;
  }, [queueVoiceQuestion]);

  useEffect(() => {
    if (!started || complete || countdown !== null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b" || event.repeat) return;
      if (voiceKeyHeldRef.current) return;
      voiceKeyHeldRef.current = true;
      if (voiceStatus !== "thinking" || !voiceQuestionRef.current) {
        return;
      }
      event.preventDefault();
      startListeningRef.current();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b") return;
      voiceKeyHeldRef.current = false;
      event.preventDefault();
      stopListeningRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      voiceKeyHeldRef.current = false;
    };
  }, [complete, countdown, started, voiceStatus]);

  useEffect(() => {
    return () => {
      clearVoiceTimer();
      stopVoiceRecognition();
      window.speechSynthesis?.cancel();
    };
  }, [clearVoiceTimer, stopVoiceRecognition]);

  const finishAssessment = useCallback(() => {
    if (finalResult) return;
    const metrics = metricsRef.current;
    if (systemFaultActiveRef.current) {
      metrics.systemMisses += 1;
      systemFaultActiveRef.current = false;
      pushEvent("System", "Active fault missed at finish", "miss");
    }
    if (activeSignalRef.current?.actionable) {
      activeSignalRef.current = null;
      setActiveSignal(null);
    }
    if (hasMathTask) {
      let correct = 0;
      let incorrect = 0;
      let answered = 0;
      for (const question of mathQuestionsRef.current) {
        const rawAnswer = mathAnswersRef.current[question.id]?.trim();
        if (!rawAnswer) continue;
        const value = Number(rawAnswer);
        if (Number.isNaN(value)) continue;
        answered += 1;
        if (value === question.answer) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }
      metrics.mathQuestions = mathQuestionsRef.current.length;
      metrics.mathCorrect = correct;
      metrics.mathIncorrect = incorrect;
      metrics.mathAnswered = answered;
    }
    const durationSeconds = Math.round(
      startedAtRef.current
        ? Math.min(
            config.sessionLengthSeconds,
            (performance.now() - startedAtRef.current) / 1000,
          )
        : elapsed,
    );
    const expectedSystemFaults = expectedSystemFaultsForRun(
      config.sessionLengthSeconds,
    );
    const systemRequired = Math.max(metrics.systemFaults, expectedSystemFaults);
    const systemScore = Math.round(
      clamp(
        (metrics.systemAcknowledgements / systemRequired) * 100 -
          metrics.systemWrongCorrections * 12,
        0,
        100,
      ),
    );
    const expectedGreenSignals = expectedGreenSignalsForRun(
      settings,
      config.sessionLengthSeconds,
    );
    const requestedCells = requestedCellsRef.current;
    const clickedCellsSnapshot = clickedCellsRef.current;
    let correctCells = 0;
    let incorrectCells = 0;
    for (const position of clickedCellsSnapshot) {
      if (requestedCells.has(position)) {
        correctCells += 1;
      } else {
        incorrectCells += 1;
      }
    }
    const requiredCells = Math.max(requestedCells.size, expectedGreenSignals);
    const missedCells = Math.max(0, requestedCells.size - correctCells);
    metrics.gridHits = correctCells;
    metrics.gridMisses = missedCells;
    metrics.gridFalseAlarms = incorrectCells;
    metrics.gridWrongCellClicks = incorrectCells;
    metrics.gridDistractorClicks = 0;
    const gridScore = Math.round(
      clamp((correctCells / requiredCells) * 100 - incorrectCells * 10, 0, 100),
    );
    const voiceScore =
      hasVoiceTask && voiceEnabled
        ? Math.round(
            (metrics.voiceCorrect /
              Math.max(
                metrics.voiceQuestions,
                expectedVoiceQuestionsForRun(config.sessionLengthSeconds),
              )) *
              100,
          )
        : metrics.voiceUnsupported
          ? 0
          : 100;
    const unansweredMath = Math.max(
      0,
      metrics.mathQuestions - metrics.mathAnswered,
    );
    const mathScore =
      metrics.mathQuestions > 0
        ? Math.round((metrics.mathCorrect / metrics.mathQuestions) * 100)
        : hasMathTask
          ? 0
          : 100;
    const scores = [
      systemScore,
      gridScore,
      ...(hasVoiceTask && voiceEnabled ? [voiceScore] : []),
      ...(hasMathTask ? [mathScore] : []),
    ];

    setFinalResult({
      compositeScore: Math.round(
        scores.reduce((total, score) => total + score, 0) / scores.length,
      ),
      breakdown: {
        systemMonitoring: systemScore,
        gridSelection: gridScore,
        ...(hasVoiceTask && voiceEnabled ? { voiceResponse: voiceScore } : {}),
        ...(hasMathTask ? { resourceManagement: mathScore } : {}),
      },
      rawMetrics: {
        systemMonitoring: {
          faults: metrics.systemFaults,
          acknowledgements: metrics.systemAcknowledgements,
          misses: metrics.systemMisses,
          attempts: metrics.systemAttempts,
          wrongCorrections: metrics.systemWrongCorrections,
          gaugeOutOfBandSeconds: Math.round(metrics.gaugeOutOfBandSeconds),
        },
        gridSelection: {
          hits: metrics.gridHits,
          misses: metrics.gridMisses,
          falseAlarms: metrics.gridFalseAlarms,
          wrongCellClicks: metrics.gridWrongCellClicks,
          distractorClicks: metrics.gridDistractorClicks,
          signals: metrics.gridSignals,
          correctCells,
          incorrectCells,
        },
        ...(hasVoiceTask && voiceEnabled
          ? {
              voiceResponse: {
                questions: metrics.voiceQuestions,
                correct: metrics.voiceCorrect,
                incorrect: metrics.voiceIncorrect,
                missed: metrics.voiceMissed,
                unsupported: metrics.voiceUnsupported,
              },
            }
          : {}),
        ...(hasMathTask
          ? {
              resourceManagement: {
                questions: metrics.mathQuestions,
                correct: metrics.mathCorrect,
                incorrect: metrics.mathIncorrect,
                unanswered: unansweredMath,
                answered: metrics.mathAnswered,
              },
            }
          : {}),
      },
      durationSeconds,
      enabledSubtasks: [
        "system-monitoring",
        "grid-selection",
        ...(hasVoiceTask && voiceEnabled ? ["voice-response"] : []),
        ...(hasMathTask ? ["math-questions"] : []),
      ],
      eventLog: allEventsRef.current.slice().reverse(),
    });
    setComplete(true);
    setStarted(false);
    clearVoiceTimer();
    stopVoiceRecognition();
    window.speechSynthesis?.cancel();
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [
    clearVoiceTimer,
    config.sessionLengthSeconds,
    elapsed,
    finalResult,
    hasMathTask,
    hasVoiceTask,
    pushEvent,
    settings,
    stopVoiceRecognition,
    voiceEnabled,
  ]);

  useRecordRealModeScore({
    completed: Boolean(finalResult),
    mode: config.mode,
    topicSlug: "multitasking-assessment",
    topicTitle: "Multitasking Assessment",
    score: finalResult?.compositeScore ?? 0,
    maxScore: 100,
    questionCount: 100,
    timeTakenSeconds: finalResult?.durationSeconds,
    difficulty: config.difficulty,
    metadata: finalResult
      ? {
          assessmentMode: config.assessmentMode,
          ownId: config.ownId,
          enabledSubtasks: finalResult.enabledSubtasks,
          breakdown: finalResult.breakdown,
          rawMetrics: finalResult.rawMetrics,
          eventLog: finalResult.eventLog,
        }
      : undefined,
  });

  const beginAssessment = useCallback(() => {
    const now = performance.now();
    startedAtRef.current = now;
    lastFrameRef.current = null;
    systemFaultActiveRef.current = false;
    requestedCellsRef.current = new Set();
    gaugePlanRef.current = makeGaugePlan(now, settings.gaugeSpeed);
    gaugeDirectionRef.current = gaugePlanRef.current.direction;
    nextSignalAtRef.current = now + randomBetween(settings.signalEveryMs);
    setClickedCells(new Set());
    if (hasMathTask) {
      const questions = makeMathQuestionSet();
      metricsRef.current.mathQuestions = questions.length;
      setMathQuestions(questions);
      setMathAnswers({});
      mathQuestionsRef.current = questions;
      mathAnswersRef.current = {};
    }
    pushEvent("Session", "Assessment started", "info");
    if (hasVoiceTask && voiceEnabled) {
      queueVoiceQuestion();
    }
  }, [
    hasMathTask,
    hasVoiceTask,
    pushEvent,
    queueVoiceQuestion,
    settings.gaugeSpeed,
    settings.signalEveryMs,
    voiceEnabled,
  ]);

  const startCountdown = () => {
    const voiceWarning = hasVoiceTask ? getVoiceRecognitionBrowserWarning() : null;
    setVoiceEnabled(!voiceWarning);
    if (voiceWarning) {
      metricsRef.current.voiceUnsupported = true;
      setVoiceStatus("unsupported");
      setVoiceQuestion(null);
      setVoiceAnswerText(voiceWarning);
    }
    setStarted(true);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        beginAssessment();
        return;
      }
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [beginAssessment, countdown]);

  useEffect(() => {
    if (!started || complete || countdown !== null) return;

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      const deltaSeconds = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;
      const elapsedSeconds = (now - startedAtRef.current) / 1000;
      setElapsed(elapsedSeconds);

      if (elapsedSeconds >= config.sessionLengthSeconds) {
        finishAssessment();
        return;
      }

      setSystemGauge((current) => {
        const plan = gaugePlanRef.current;
        if (now >= plan.nextChangeAt) {
          const shouldReverse =
            Math.random() < 0.46 ||
            current < greenLow - 8 ||
            current > greenHigh + 8;
          plan.direction = shouldReverse
            ? ((plan.direction * -1) as 1 | -1)
            : plan.direction;
          plan.speed = settings.gaugeSpeed * (0.28 + Math.random() * 1.35);
          plan.nextChangeAt = now + 520 + Math.random() * 2100;
          plan.pauseUntil =
            Math.random() < 0.18 ? now + 260 + Math.random() * 520 : 0;
          gaugeDirectionRef.current = plan.direction;
        }

        const paused = now < plan.pauseUntil;
        const jitter = (Math.random() - 0.5) * settings.gaugeSpeed * 0.42;
        let nextValue = current;
        if (!paused) {
          nextValue += plan.direction * plan.speed * deltaSeconds;
        }
        nextValue += jitter * deltaSeconds;

        if (nextValue >= 96) {
          nextValue = 96;
          plan.direction = -1;
          gaugeDirectionRef.current = plan.direction;
        }
        if (nextValue <= 4) {
          nextValue = 4;
          plan.direction = 1;
          gaugeDirectionRef.current = plan.direction;
        }
        const nextState = gaugeState(nextValue);
        if (nextState !== "safe") {
          metricsRef.current.gaugeOutOfBandSeconds += deltaSeconds;
          if (!systemFaultActiveRef.current) {
            systemFaultActiveRef.current = true;
            metricsRef.current.systemFaults += 1;
            pushEvent("System", `${nextState.toUpperCase()} fault appeared`, "fault");
          }
        } else if (systemFaultActiveRef.current) {
          systemFaultActiveRef.current = false;
          metricsRef.current.systemMisses += 1;
          pushEvent("System", "Fault returned safe without correction", "miss");
        }
        return nextValue;
      });

      if (now >= nextSignalAtRef.current && !activeSignalRef.current) {
        const actionable = Math.random() > 0.34;
        const signal = {
          lightIndex: Math.floor(Math.random() * 3),
          position: randomGridPosition(),
          expiresAt: now + settings.signalTimeoutMs,
          actionable,
        };
        if (actionable) {
          metricsRef.current.gridSignals += 1;
          requestedCellsRef.current.add(signal.position);
        } else {
          metricsRef.current.gridDistractors += 1;
        }
        setActiveSignal(signal);
        pushEvent(
          "Grid",
          actionable
            ? `Green signal requests ${signal.position}`
            : `Red distractor shows ${signal.position}`,
          "info",
        );
        nextSignalAtRef.current = now + randomBetween(settings.signalEveryMs);
      }

      if (activeSignalRef.current && now > activeSignalRef.current.expiresAt) {
        setActiveSignal(null);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    complete,
    config.sessionLengthSeconds,
    countdown,
    finishAssessment,
    pushEvent,
    settings,
    started,
  ]);

  const handleSystemCorrection = (direction: Direction) => {
    const state = gaugeState(systemGauge);
    if (state === "safe") return;
    if (!systemFaultActiveRef.current) {
      systemFaultActiveRef.current = true;
      metricsRef.current.systemFaults += 1;
    }
    metricsRef.current.systemAttempts += 1;
    const correct =
      (state === "high" && direction === "up") ||
      (state === "low" && direction === "down");
    if (correct) {
      metricsRef.current.systemAcknowledgements += 1;
      systemFaultActiveRef.current = false;
      setSystemGauge(60);
      gaugeDirectionRef.current = state === "high" ? -1 : 1;
      pushEvent("System", `${direction.toUpperCase()} correction accepted`, "hit");
    } else {
      metricsRef.current.systemMisses += 1;
      metricsRef.current.systemWrongCorrections += 1;
      pushEvent("System", `${direction.toUpperCase()} correction rejected`, "miss");
    }
  };

  const handleGridClick = (position: string) => {
    if (clickedCellsRef.current.has(position)) return;
    const nextClicked = new Set(clickedCellsRef.current).add(position);
    clickedCellsRef.current = nextClicked;
    setClickedCells(nextClicked);
    pushEvent("Grid", `${position} marked`, "info");
  };

  const systemState = gaugeState(systemGauge);

  if (finalResult) {
    const breakdownRows = [
      ["System Monitoring", finalResult.breakdown.systemMonitoring],
      ["Grid Selection", finalResult.breakdown.gridSelection],
      ...(finalResult.breakdown.voiceResponse !== undefined
        ? [["Voice Response", finalResult.breakdown.voiceResponse] as const]
        : []),
      ...(finalResult.breakdown.resourceManagement !== undefined
        ? [["Math Questions", finalResult.breakdown.resourceManagement] as const]
        : []),
    ];

    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-brand-gold">
            Assessment Complete
          </p>
          <h2 className="mt-3 text-5xl font-bold text-zinc-950 dark:text-white">
            {finalResult.compositeScore}%
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Composite score across {breakdownRows.length} active scored tasks in{" "}
            {formatClock(finalResult.durationSeconds)}.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {breakdownRows.map(([label, score]) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{label}</span>
                  <span className="text-violet-700 dark:text-brand-gold">
                    {score}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-700 dark:bg-brand-gold"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onRestart}
            className="mt-8 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-brand-gold">
            Ready Room
          </p>
          <h2 className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">
            {formatClock(config.sessionLengthSeconds)} MATB Run
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Keep the gauge inside the green band, respond only to green signal
            coordinates on the grid, ignore red-coordinate distractions, and
            answer spoken voice prompts while filling math boxes before the
            timer ends.
          </p>
          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5 text-left dark:border-brand-gold/20 dark:bg-brand-gold/10">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Play guide
            </h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200 md:grid-cols-2">
              <div>
                <span className="font-bold">System Monitoring:</span> the gauge
                marker moves with changing speed, pauses, reversals, and small
                jitter. The triangle buttons stay neutral. If the marker turns
                red above the green band, click ▲. If it turns red below the
                green band, click ▼.
              </div>
              <div>
                <span className="font-bold">Grid Selection:</span> rows are A-J
                and columns are 1-10. The cells are intentionally blank. Click
                cells shown by green signal dots, such as A-4. Clicked cells
                stay green. You can remember signals and click them later; only
                correct versus incorrect cells affect the grid score.
              </div>
              <div>
                <span className="font-bold">Signal Lights:</span> the three red
                lights may show coordinates as distractions. Click the grid only
                when the coordinate is inside a green light. Stay still when it
                stays red.
              </div>
              <div>
                <span className="font-bold">Math Questions:</span> in Full 4,
                all mixed-difficulty questions are visible at once. Easy is
                3-digit add/subtract; harder rows include 2-digit multiply and
                clean division. There is no Submit button; typed answers are
                scored automatically when the session timer ends.
              </div>
              <div>
                <span className="font-bold">Voice Response:</span> a random
                arithmetic question is spoken aloud. When the status says
                Think, hold the B key, say the numeric answer clearly, then
                release B to submit that voice attempt.
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-1">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
              Mode:{" "}
              <span className="font-bold">
                {config.assessmentMode === "core2"
                  ? "2 Tasks"
                  : config.assessmentMode === "core"
                    ? "3 Tasks"
                    : "4 Tasks"}
              </span>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={startCountdown}
              className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-600"
            >
              Start Assessment
            </button>
            <button
              onClick={onRestart}
              className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const systemCard = (
    <section className="rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/5 dark:bg-black/40">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
        System Monitoring
      </h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Click ▲ only when the red marker is above the green band. Click ▼ only
        when the red marker is below the green band.
      </p>
      <div className="mt-3 flex items-center justify-center gap-5">
        <div className="flex h-40 flex-col items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <span>HIGH</span>
          <span className="text-zinc-700 dark:text-zinc-200">
            {Math.round(systemGauge)}
          </span>
          <span>LOW</span>
        </div>
        <div className="relative h-40 w-10 bg-zinc-200 dark:bg-white/10">
          <div className="absolute bottom-[50%] left-0 h-[20%] w-full bg-emerald-400/45" />
          <div
            className={`absolute left-1/2 h-3 w-9 -translate-x-1/2 ${
              systemState === "safe"
                ? "bg-violet-700 dark:bg-brand-gold"
                : "bg-rose-500"
            }`}
            style={{ bottom: `calc(${systemGauge}% - 0.5rem)` }}
          />
        </div>
        <div className="flex h-40 flex-col items-center justify-between">
          <button
            onClick={() => handleSystemCorrection("up")}
            className="text-4xl font-black leading-none text-zinc-500 transition hover:text-rose-500 dark:text-zinc-300 dark:hover:text-rose-300"
            aria-label="Upper correction"
          >
            ▲
          </button>
          <button
            onClick={() => handleSystemCorrection("down")}
            className="text-4xl font-black leading-none text-zinc-500 transition hover:text-rose-500 dark:text-zinc-300 dark:hover:text-rose-300"
            aria-label="Lower correction"
          >
            ▼
          </button>
        </div>
      </div>
    </section>
  );

  const voiceCard = (
    <section className="rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/5 dark:bg-black/40">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        Voice Response
      </p>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Hold B while speaking. Release B to submit.
      </p>
      <p className="mt-2 text-xl font-black text-zinc-950 dark:text-white">
        {voiceQuestion?.prompt ?? "Voice prompt loading"}
      </p>
      <input
        readOnly
        value={voiceAnswerText}
        placeholder={
          voiceStatus === "listening"
            ? "Listening while B is held"
            : voiceStatus === "unsupported"
              ? "Use Chrome or Safari"
              : "Waiting for voice answer"
        }
        className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-950 outline-none dark:border-white/10 dark:bg-black dark:text-white"
      />
    </section>
  );

  const voiceUnavailableCard = (
    <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
        Voice Response Off
      </p>
      <p className="mt-1 text-xs leading-5">
        Voice input is scored only in Chrome or Safari. This browser will skip
        the voice section and exclude it from your score.
      </p>
    </section>
  );

  const mathCard = hasMathTask ? (
    <section className="rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/5 dark:bg-black/40">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
        Math Questions
      </h3>
      <p className="mt-1 text-xs leading-4 text-zinc-500 dark:text-zinc-400">
        Fill any boxes you want. Answers are scored automatically when the
        session timer ends.
      </p>
      <div className="mt-3 space-y-1.5">
        {mathQuestions.map((question) => (
          <div
            key={question.id}
            className="rounded-lg bg-zinc-50 p-1.5 dark:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="w-20 flex-1 text-sm font-black text-zinc-950 dark:text-white">
                {question.a} {question.operator} {question.b}
              </span>
              <input
                inputMode="numeric"
                value={mathAnswers[question.id] ?? ""}
                onChange={(event) =>
                  setMathAnswers((current) => {
                    const next = {
                      ...current,
                      [question.id]: event.target.value,
                    };
                    mathAnswersRef.current = next;
                    return next;
                  })
                }
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-bold text-zinc-950 outline-none focus:border-violet-700 dark:border-white/10 dark:bg-black dark:text-white"
                placeholder="Answer"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="h-screen overflow-hidden bg-[#F1F5F9] dark:bg-transparent">
      {countdown !== null ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/10 backdrop-blur-[1px]">
          <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/80 bg-violet-700 text-7xl font-black text-white shadow-2xl shadow-violet-900/30 dark:border-brand-gold/70 dark:bg-black">
            {countdown}
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-zinc-200 bg-white px-4 py-2 dark:border-white/5 dark:bg-black/40 dark:backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-brand-gold">
              Live Assessment
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Multitasking Assessment
            </h2>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {config.assessmentMode === "core2"
                ? "2 Tasks"
                : config.assessmentMode === "core"
                  ? "3 Tasks"
                  : "4 Tasks"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {countdown === null ? (
              <Timer
                compact
                timeLimit={config.sessionLengthSeconds}
                onTimeUp={finishAssessment}
              />
            ) : (
              <div className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-black text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                {formatClock(config.sessionLengthSeconds)}
              </div>
            )}
            <QuizFooterNav onExit={finishAssessment} />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(250px,0.85fr)_minmax(360px,1.15fr)_minmax(260px,0.8fr)]">
          <div className="min-h-0">{mathCard ?? systemCard}</div>

          <div className="flex min-h-0 flex-col gap-3">
            <section className="rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/5 dark:bg-black/40">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Coordinate Grid
              </h3>
              <p className="mt-1 text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                Click only the green signal coordinate. Clicked cells turn green.
              </p>
              <div className="mx-auto mt-2 grid max-w-[390px] grid-cols-[1.25rem_repeat(10,minmax(0,1fr))] gap-0.5 text-center text-[11px] font-bold">
                <div />
                {columns.map((column) => (
                  <div key={column} className="text-zinc-500 dark:text-zinc-400">
                    {column}
                  </div>
                ))}
                {rows.map((row) => (
                  <Fragment key={row}>
                    <div className="flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                      {row}
                    </div>
                    {columns.map((column) => {
                      const position = `${row}-${column}`;
                      const wasClicked = clickedCells.has(position);
                      return (
                        <button
                          key={position}
                          onClick={() => handleGridClick(position)}
                          aria-label={position}
                          className={`aspect-square rounded-sm border transition ${
                            wasClicked
                              ? "border-emerald-300 bg-emerald-500 dark:border-emerald-300 dark:bg-emerald-500"
                              : "border-zinc-200 bg-zinc-50 hover:border-violet-500 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-brand-gold/10"
                          }`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </section>

            {hasVoiceTask
              ? voiceEnabled
                ? voiceCard
                : voiceUnavailableCard
              : null}
          </div>

          <section className="space-y-4">
            <div className="rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/5 dark:bg-black/40">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Signal Lights
              </h3>
              <p className="mt-1 text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                Green dot with coordinate means click that grid cell. Red dot
                with coordinate is a fake cue; do nothing.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => {
                  const isActive = activeSignal?.lightIndex === index;
                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-full border-4 text-sm font-black ${
                        isActive && activeSignal.actionable
                          ? "border-emerald-300 bg-emerald-500 text-white"
                          : "border-rose-300 bg-rose-600 text-white/70"
                      }`}
                    >
                      {isActive ? activeSignal.position : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {hasMathTask ? systemCard : null}
          </section>
        </div>
      </div>
    </div>
  );
}
