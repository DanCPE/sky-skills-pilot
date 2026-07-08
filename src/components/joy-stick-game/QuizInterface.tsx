"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TopicLayout from "@/components/TopicLayout";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type { JoyStickGameQuizResponse } from "@/types";
import ResultsScreen from "./ResultsScreen";

const FIELD_WIDTH = 960;
const FIELD_HEIGHT = 540;
const HEX_RADIUS = 24;
const TARGET_RADIUS = 7;
const OBSTACLE_RADIUS = 8;
const CAPTURE_MS = 1500;
const BASE_PLAYER_SPEED = 2.2;
const MAX_PLAYER_SPEED = 11.5;
const PLAYER_ACCELERATION = 0.34;
const PLAYER_BRAKE_DECELERATION = 0.13;
const VOICE_INPUT_ENABLED = true;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
  };
};

type TargetColor = "red" | "green";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Player extends Point {
  angle: number;
  moving: boolean;
  speed: number;
}

interface Obstacle extends Point {
  vx: number;
  vy: number;
}

interface GameSnapshot {
  player: Player;
  redTarget: Point;
  greenTarget: Point;
  targetColor: TargetColor;
  obstacles: Obstacle[];
}

interface VoiceRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: VoiceRecognitionAlternative;
}

interface VoiceRecognitionResultList {
  readonly length: number;
  [index: number]: VoiceRecognitionResult;
}

interface VoiceRecognitionResultEvent {
  resultIndex: number;
  results: VoiceRecognitionResultList;
}

interface VoiceRecognitionErrorEvent {
  error: string;
}

interface VoiceRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onresult: ((event: VoiceRecognitionResultEvent) => void) | null;
  onstart: (() => void) | null;
  processLocally?: boolean;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

type VoiceRecognitionConstructor = new () => VoiceRecognition;

declare global {
  interface Window {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  }
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

  if (!isGoogleChrome && !isSafari) {
    return "Voice input is available only in Chrome or Safari. Use one of those browsers to answer by holding B.";
  }

  return null;
}

interface QuizInterfaceProps {
  quizData: JoyStickGameQuizResponse;
  onRestart: () => void;
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomTarget(): Point {
  return {
    x: randomInRange(70, FIELD_WIDTH - 70),
    y: randomInRange(70, FIELD_HEIGHT - 70),
  };
}

function randomTargetPair() {
  const redTarget = randomTarget();
  let greenTarget = randomTarget();
  while (distance(redTarget, greenTarget) < HEX_RADIUS * 3) {
    greenTarget = randomTarget();
  }

  return { redTarget, greenTarget };
}

function randomTargetColor(): TargetColor {
  return Math.random() > 0.5 ? "green" : "red";
}

function createObstacles(count: number, speed: number): Obstacle[] {
  return Array.from({ length: count }, () => {
    const angle = randomInRange(0, Math.PI * 2);
    const velocity = randomInRange(0.75, 1.25) * speed;
    return {
      x: randomInRange(60, FIELD_WIDTH - 60),
      y: randomInRange(60, FIELD_HEIGHT - 60),
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
    };
  });
}

function createInitialSnapshot(obstacleCount: number, obstacleSpeed: number) {
  const targets = randomTargetPair();

  return {
    player: {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 2,
      angle: -Math.PI / 2,
      moving: false,
      speed: 0,
    },
    ...targets,
    targetColor: randomTargetColor(),
    obstacles: createObstacles(obstacleCount, obstacleSpeed),
  };
}

function parseSpokenNumber(transcript: string): string | null {
  const cleaned = transcript
    .toLowerCase()
    .replaceAll("-", " ")
    .replace(/[^\w\s-]/g, " ")
    .trim();

  const directNumber = cleaned.match(/-?\d+/);
  if (directNumber) {
    return directNumber[0];
  }

  const units: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    for: 4,
    full: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
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
  };
  const tens: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fourty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  let total = 0;
  let current = 0;
  let foundNumberWord = false;
  let negative = false;

  for (const token of cleaned.split(/\s+/)) {
    if (token === "minus" || token === "negative") {
      negative = true;
    } else if (token in units) {
      current += units[token];
      foundNumberWord = true;
    } else if (token in tens) {
      current += tens[token];
      foundNumberWord = true;
    } else if (token === "hundred") {
      current = Math.max(1, current) * 100;
      foundNumberWord = true;
    } else if (token === "thousand") {
      total += Math.max(1, current) * 1000;
      current = 0;
      foundNumberWord = true;
    }
  }

  if (!foundNumberWord) return null;
  const parsed = total + current;
  return String(negative ? -parsed : parsed);
}

function parseSpokenDigitSequence(transcript: string): string | null {
  const digitWords: Record<string, string> = {
    zero: "0",
    oh: "0",
    o: "0",
    one: "1",
    two: "2",
    to: "2",
    too: "2",
    three: "3",
    four: "4",
    for: "4",
    full: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    ate: "8",
    nine: "9",
  };
  const cleaned = transcript
    .toLowerCase()
    .replaceAll("-", " ")
    .replace(/[^\w\s]/g, " ")
    .trim();
  const digits = cleaned
    .split(/\s+/)
    .flatMap((token) => {
      if (/^\d+$/.test(token)) return token.split("");
      return digitWords[token] ? [digitWords[token]] : [];
    });

  return digits.length > 0 ? digits.join("") : null;
}

function isRepeatCommand(transcript: string): boolean {
  return /\b(repeat|say again|again|one more time)\b/i.test(transcript);
}

function formatExpressionForSpeech(expression: string) {
  return expression
    .replace(/\bFL(\d+)\b/g, " flight level $1 ")
    .replaceAll("ft/min", " feet per minute ")
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("+", " plus ")
    .replaceAll("-", " minus ");
}

export default function QuizInterface({
  quizData,
  onRestart,
}: QuizInterfaceProps) {
  const { questions, mode } = quizData;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(
    questions[0]?.timeLimitSeconds ?? 0,
  );
  const [quizStarted, setQuizStarted] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechStatus, setSpeechStatus] = useState("Voice ready");
  const [isListening, setIsListening] = useState(false);
  const [autoMicEnabled, setAutoMicEnabled] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState("Mic ready");
  const [voiceBrowserWarning, setVoiceBrowserWarning] = useState<string | null>(
    null,
  );
  const [voiceInputAvailable, setVoiceInputAvailable] = useState(true);
  const [showQuestionPopup, setShowQuestionPopup] = useState(true);
  const [obstacleSpeed, setObstacleSpeed] = useState(2.4);
  const [obstacleCount, setObstacleCount] = useState(4);
  const [sensitivity, setSensitivity] = useState(1);
  const [targetCaptures, setTargetCaptures] = useState(0);
  const [obstacleHits, setObstacleHits] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number | undefined>();
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    createInitialSnapshot(4, 2.4),
  );

  const currentQuestion = questions[currentQuestionIndex];
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameRef = useRef<GameSnapshot>(snapshot);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const captureStartedAtRef = useRef<number | null>(null);
  const lastObstacleAtRef = useRef(0);
  const quizStartTimeRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef<number | null>(null);
  const submittedQuestionIdsRef = useRef<Set<string>>(new Set());
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenQuestionIdRef = useRef<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const autoMicEnabledRef = useRef(false);
  const quizStartedRef = useRef(false);
  const quizCompleteRef = useRef(false);
  const answerRef = useRef("");
  const startVoiceRecognitionRef = useRef<((cancelSpeech?: boolean) => void) | null>(
    null,
  );
  const voiceKeyHeldRef = useRef(false);
  const voiceSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVoiceTranscriptRef = useRef("");
  const sensitivityRef = useRef(sensitivity);
  const obstacleSpeedRef = useRef(obstacleSpeed);
  const obstacleCountRef = useRef(obstacleCount);
  const captureProgressRef = useRef(0);

  const progress = useMemo(() => {
    if (!currentQuestion) return 0;
    return Math.max(
      0,
      Math.min(100, (remainingSeconds / currentQuestion.timeLimitSeconds) * 100),
    );
  }, [currentQuestion, remainingSeconds]);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const resetField = useCallback((nextObstacleCount = obstacleCountRef.current) => {
    const nextSnapshot = createInitialSnapshot(
      nextObstacleCount,
      obstacleSpeedRef.current,
    );
    gameRef.current = nextSnapshot;
    captureStartedAtRef.current = null;
    captureProgressRef.current = 0;
    setCaptureProgress(0);
    setSnapshot(nextSnapshot);
  }, []);

  const scheduleAutoMic = useCallback(() => {
    if (!VOICE_INPUT_ENABLED) return;

    if (
      !autoMicEnabledRef.current ||
      !quizStartedRef.current ||
      quizCompleteRef.current
    ) {
      return;
    }

    setTimeout(() => {
      startVoiceRecognitionRef.current?.(false);
    }, 250);
  }, []);

  const playTone = useCallback((kind: "capture" | "obstacle" | "start") => {
    const audioContext = audioContextRef.current;
    if (!audioContext || audioContext.state !== "running") return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = kind === "obstacle" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(
      kind === "obstacle" ? 190 : kind === "capture" ? 780 : 520,
      audioContext.currentTime,
    );
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      kind === "obstacle" ? 0.42 : 0.16,
      audioContext.currentTime + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + (kind === "obstacle" ? 0.32 : 0.1),
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (kind === "obstacle" ? 0.35 : 0.12));
  }, []);

  const enableAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    await audioContextRef.current.resume();
    setAudioEnabled(true);
    playTone("start");
  }, [playTone]);

  const speakQuestion = useCallback((force = false) => {
    if (!currentQuestion || typeof window === "undefined") return false;
    if (!speechEnabled && !force) return false;
    if (lastSpokenQuestionIdRef.current === currentQuestion.id && !force) {
      return true;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      setSpeechStatus("Voice not supported in this browser");
      return false;
    }

    lastSpokenQuestionIdRef.current = currentQuestion.id;
    const questionSpeechText = currentQuestion.expression.startsWith(
      "Say these numbers backward",
    )
      ? currentQuestion.expression
      : `What is ${formatExpressionForSpeech(currentQuestion.expression)}?`;

    const utterance = new SpeechSynthesisUtterance(questionSpeechText);
    const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
    const englishVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
      voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    utterance.lang = englishVoice?.lang ?? "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeechStatus("Speaking question");
    utterance.onend = () => {
      setSpeechStatus("Voice ready");
      scheduleAutoMic();
    };
    utterance.onerror = (event) => {
      if (event.error === "canceled") {
        setSpeechStatus("Voice blocked by browser - try Edge or Chrome");
      } else {
        setSpeechStatus(`Voice error: ${event.error}`);
      }
      scheduleAutoMic();
    };
    speechUtteranceRef.current = utterance;

    synth.cancel();
    setTimeout(() => {
      if (speechUtteranceRef.current === utterance) {
        window.speechSynthesis?.resume();
        window.speechSynthesis?.speak(utterance);
      }
    }, 50);

    return true;
  }, [currentQuestion, scheduleAutoMic, speechEnabled]);

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex >= questions.length - 1) {
      if (quizStartTimeRef.current !== null) {
        setTotalTimeTaken(
          Math.floor((Date.now() - quizStartTimeRef.current) / 1000),
        );
      }
      setQuizComplete(true);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = questions[nextIndex];
    if (voiceSubmitTimerRef.current) {
      clearTimeout(voiceSubmitTimerRef.current);
      voiceSubmitTimerRef.current = null;
    }
    recognitionRef.current?.abort();
    answerRef.current = "";
    setAnswer("");
    setRemainingSeconds(nextQuestion.timeLimitSeconds);
    questionStartedAtRef.current = Date.now();
    setCurrentQuestionIndex(nextIndex);
  }, [currentQuestionIndex, questions]);

  const recordAnswer = useCallback((value: string) => {
    if (!currentQuestion || submittedQuestionIdsRef.current.has(currentQuestion.id)) {
      return;
    }

    submittedQuestionIdsRef.current.add(currentQuestion.id);
    const cleanedAnswer = value.trim();
    const isCorrect = Number(cleanedAnswer) === currentQuestion.correctAnswer;
    const startedAt = questionStartedAtRef.current ?? Date.now();

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        answer: cleanedAnswer,
        isCorrect,
        timeTaken: Math.floor((Date.now() - startedAt) / 1000),
      },
    ]);

    moveToNextQuestion();
  }, [currentQuestion, moveToNextQuestion]);

  const captureTarget = useCallback(() => {
    if (!quizStarted || quizComplete || captureProgressRef.current < 100) return;
    playTone("capture");
    setTargetCaptures((prev) => prev + 1);
    resetField();
  }, [playTone, quizComplete, quizStarted, resetField]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer.trim()) return;
    recordAnswer(answer);
  };

  const startVoiceRecognition = useCallback(async (cancelSpeech = false) => {
    if (!VOICE_INPUT_ENABLED || !voiceInputAvailable) return;
    if (!quizStarted || quizComplete || !currentQuestion || isListening) return;
    if (typeof window === "undefined") return;

    if (
      !cancelSpeech &&
      (window.speechSynthesis?.speaking || window.speechSynthesis?.pending)
    ) {
      setVoiceInputStatus("Waiting for question voice...");
      setTimeout(() => startVoiceRecognitionRef.current?.(false), 250);
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceInputStatus("Voice input is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setVoiceInputStatus("Mic permission blocked");
      return;
    }

    const createRecognition = (processLocally: boolean) => {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      if ("processLocally" in recognition) {
        recognition.processLocally = processLocally;
      }
      return recognition;
    };

    const runRecognition = (processLocally: boolean) => {
      if (cancelSpeech) {
        window.speechSynthesis?.cancel();
      }
      const recognition = createRecognition(processLocally);

      const clearPendingVoiceSubmit = () => {
        if (voiceSubmitTimerRef.current) {
          clearTimeout(voiceSubmitTimerRef.current);
          voiceSubmitTimerRef.current = null;
        }
      };

      const fallbackToRepeat = (message: string) => {
        clearPendingVoiceSubmit();
        recognition.abort();
        recognitionRef.current = null;
        setIsListening(false);
        setVoiceInputStatus(message);
        speakQuestion(true);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceInputStatus(
          processLocally ? "Listening locally..." : "Listening...",
        );
      };
      recognition.onerror = (event) => {
        clearPendingVoiceSubmit();
        setIsListening(false);

        if (event.error === "language-not-supported" && processLocally) {
          setVoiceInputStatus("Local voice unavailable. Trying browser voice...");
          recognitionRef.current = null;
          setTimeout(() => runRecognition(false), 150);
          return;
        }

        if (event.error === "network") {
          setVoiceInputStatus(
            "Mic needs browser speech service. Try Chrome/Edge online, or type the answer.",
          );
          return;
        }

        if (event.error === "no-speech") {
          fallbackToRepeat("No speech heard. Repeating question");
          return;
        }

        setVoiceInputStatus(`Mic error: ${event.error}`);
      };
      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };
      recognition.onresult = (event) => {
        const result = event.results[event.resultIndex];
        const transcriptParts: string[] = [];
        for (let index = 0; index < event.results.length; index += 1) {
          const part = event.results[index][0]?.transcript.trim();
          if (part) {
            transcriptParts.push(part);
          }
        }
        const transcript =
          transcriptParts.join(" ").trim() || result[0]?.transcript.trim() || "";
        if (!transcript) {
          fallbackToRepeat("Heard nothing. Repeating question");
          return;
        }

        pendingVoiceTranscriptRef.current = transcript;
        setVoiceInputStatus(
          result.isFinal ? `Heard: ${transcript}` : `Hearing: ${transcript}`,
        );

        if (!result.isFinal) {
          return;
        }

        if (isRepeatCommand(transcript)) {
          clearPendingVoiceSubmit();
          recognitionRef.current?.abort();
          recognitionRef.current = null;
          setIsListening(false);
          setVoiceInputStatus("Repeating question");
          speakQuestion(true);
          return;
        }

        clearPendingVoiceSubmit();
        voiceSubmitTimerRef.current = setTimeout(() => {
          const settledTranscript = pendingVoiceTranscriptRef.current.trim();
          const parsedAnswer =
            currentQuestion.prompt === "Read back the numbers"
              ? parseSpokenDigitSequence(settledTranscript)
              : parseSpokenNumber(settledTranscript);
          if (!parsedAnswer) {
            fallbackToRepeat(
              `Could not answer: ${settledTranscript}. Repeating question`,
            );
            return;
          }

          setAnswer(parsedAnswer);
          answerRef.current = parsedAnswer;
          setVoiceInputStatus(`Heard answer: ${parsedAnswer}. Waiting for timer.`);
          recognition.abort();
          recognitionRef.current = null;
          setIsListening(false);
        }, 450);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setIsListening(false);
        setVoiceInputStatus("Mic could not start");
      }
    };

    runRecognition(true);
  }, [
    currentQuestion,
    isListening,
    quizComplete,
    quizStarted,
    speakQuestion,
    voiceInputAvailable,
  ]);

  const beginQuiz = useCallback(async () => {
    if (quizStarted || !currentQuestion) return;
    quizStartTimeRef.current = Date.now();
    questionStartedAtRef.current = Date.now();
    setRemainingSeconds(currentQuestion.timeLimitSeconds);
    setQuizStarted(true);
    if (speechEnabled) speakQuestion(true);
    await enableAudio();
  }, [
    currentQuestion,
    enableAudio,
    quizStarted,
    speakQuestion,
    speechEnabled,
  ]);

  const startQuiz = () => {
    if (quizStarted || !currentQuestion || startCountdown !== null) return;
    const warning = getVoiceRecognitionBrowserWarning();
    setVoiceBrowserWarning(warning);
    setVoiceInputAvailable(!warning);
    if (warning) {
      autoMicEnabledRef.current = false;
      setAutoMicEnabled(false);
      setVoiceInputStatus("Voice input off");
    }
    setStartCountdown(3);
  };

  useEffect(() => {
    if (startCountdown === null) return;
    const timer = setTimeout(() => {
      if (startCountdown <= 1) {
        setStartCountdown(null);
        void beginQuiz();
        return;
      }
      setStartCountdown(startCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [beginQuiz, startCountdown]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    obstacleSpeedRef.current = obstacleSpeed;
    gameRef.current = {
      ...gameRef.current,
      obstacles: gameRef.current.obstacles.map((obstacle) => {
        const angle = Math.atan2(obstacle.vy, obstacle.vx);
        const directionSpeed = Math.hypot(obstacle.vx, obstacle.vy) || 1;
        const scale = obstacleSpeed / directionSpeed;
        return {
          ...obstacle,
          vx: Math.cos(angle) * directionSpeed * scale,
          vy: Math.sin(angle) * directionSpeed * scale,
        };
      }),
    };
  }, [obstacleSpeed]);

  useEffect(() => {
    obstacleCountRef.current = obstacleCount;
    resetField(obstacleCount);
  }, [obstacleCount, resetField]);

  useEffect(() => {
    if (!quizStarted || quizComplete || !currentQuestion) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          recordAnswer(answerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizComplete, quizStarted, recordAnswer]);

  useEffect(() => {
    if (!currentQuestion || quizComplete || !quizStarted) return;

    questionStartedAtRef.current = Date.now();
    let speechTimer: ReturnType<typeof setTimeout> | null = null;
    if (speechEnabled) {
      speechTimer = setTimeout(() => speakQuestion(), 80);
    } else if (autoMicEnabled) {
      speechTimer = setTimeout(() => startVoiceRecognitionRef.current?.(false), 250);
    }

    return () => {
      if (speechTimer) clearTimeout(speechTimer);
    };
  }, [
    autoMicEnabled,
    currentQuestion,
    quizComplete,
    quizStarted,
    speakQuestion,
    speechEnabled,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", " ", "b"].includes(key)) {
        event.preventDefault();
      }
      if (
        key === "b" &&
        VOICE_INPUT_ENABLED &&
        voiceInputAvailable &&
        quizStarted &&
        !quizComplete &&
        !event.repeat
      ) {
        if (!voiceKeyHeldRef.current) {
          voiceKeyHeldRef.current = true;
          startVoiceRecognitionRef.current?.(true);
        }
        return;
      }
      if (key === " ") {
        captureTarget();
        return;
      }
      pressedKeysRef.current.add(key);
      if (key === "w") {
        gameRef.current.player.moving = true;
        gameRef.current.player.speed = Math.max(
          gameRef.current.player.speed,
          BASE_PLAYER_SPEED,
        );
      }
      if (key === "s") {
        gameRef.current.player.moving = false;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "b") {
        voiceKeyHeldRef.current = false;
        try {
          recognitionRef.current?.stop();
        } catch {
          recognitionRef.current?.abort();
        }
        return;
      }
      pressedKeysRef.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      voiceKeyHeldRef.current = false;
    };
  }, [captureTarget, quizComplete, quizStarted, voiceInputAvailable]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => setGamepadConnected(false);
    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);
    setGamepadConnected(
      Array.from(navigator.getGamepads?.() ?? []).some(Boolean),
    );
    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!quizStarted || quizComplete) return;

    let lastTime = performance.now();
    let lastRenderTime = 0;

    const tick = (now: number) => {
      const delta = Math.min(32, now - lastTime) / 16.67;
      lastTime = now;
      const game = gameRef.current;
      const keys = pressedKeysRef.current;
      const gamepad =
        typeof navigator !== "undefined"
          ? Array.from(navigator.getGamepads?.() ?? []).find(Boolean)
          : null;
      const axisX = gamepad?.axes[0] ?? 0;
      const axisY = gamepad?.axes[1] ?? 0;
      const rotateInput =
        (keys.has("a") ? -1 : 0) +
        (keys.has("d") ? 1 : 0) +
        (Math.abs(axisX) > 0.25 ? axisX : 0);
      const forwardFromPad = axisY < -0.35 || Boolean(gamepad?.buttons[7]?.pressed);
      const stopFromPad = axisY > 0.55 || Boolean(gamepad?.buttons[1]?.pressed);

      const braking = keys.has("s") || stopFromPad;
      if (forwardFromPad) {
        game.player.moving = true;
        game.player.speed = Math.max(game.player.speed, BASE_PLAYER_SPEED);
      }
      if (braking) {
        game.player.moving = false;
      }
      if (gamepad?.buttons[0]?.pressed && captureProgressRef.current >= 100) {
        captureTarget();
      }

      game.player.angle += rotateInput * 0.064 * sensitivityRef.current * delta;
      if ((keys.has("w") || forwardFromPad) && !braking) {
        game.player.speed = Math.min(
          MAX_PLAYER_SPEED,
          game.player.speed + PLAYER_ACCELERATION * sensitivityRef.current * delta,
        );
      }
      if (braking) {
        game.player.speed = Math.max(
          0,
          game.player.speed - PLAYER_BRAKE_DECELERATION * delta,
        );
      }
      if (game.player.speed === 0) {
        game.player.moving = false;
      }
      if (game.player.speed > 0) {
        game.player.x +=
          Math.cos(game.player.angle) * game.player.speed * sensitivityRef.current * delta;
        game.player.y +=
          Math.sin(game.player.angle) * game.player.speed * sensitivityRef.current * delta;
      }
      game.player.x = Math.max(
        HEX_RADIUS,
        Math.min(FIELD_WIDTH - HEX_RADIUS, game.player.x),
      );
      game.player.y = Math.max(
        HEX_RADIUS,
        Math.min(FIELD_HEIGHT - HEX_RADIUS, game.player.y),
      );

      for (const obstacle of game.obstacles) {
        obstacle.x += obstacle.vx * delta;
        obstacle.y += obstacle.vy * delta;
        if (
          obstacle.x <= OBSTACLE_RADIUS ||
          obstacle.x >= FIELD_WIDTH - OBSTACLE_RADIUS
        ) {
          obstacle.vx *= -1;
          obstacle.x = Math.max(
            OBSTACLE_RADIUS,
            Math.min(FIELD_WIDTH - OBSTACLE_RADIUS, obstacle.x),
          );
        }
        if (
          obstacle.y <= OBSTACLE_RADIUS ||
          obstacle.y >= FIELD_HEIGHT - OBSTACLE_RADIUS
        ) {
          obstacle.vy *= -1;
          obstacle.y = Math.max(
            OBSTACLE_RADIUS,
            Math.min(FIELD_HEIGHT - OBSTACLE_RADIUS, obstacle.y),
          );
        }
      }

      const hitObstacle = game.obstacles.some(
        (obstacle) => distance(obstacle, game.player) <= HEX_RADIUS + OBSTACLE_RADIUS + 5,
      );
      if (hitObstacle && now - lastObstacleAtRef.current > 700) {
        lastObstacleAtRef.current = now;
        playTone("obstacle");
        setObstacleHits((prev) => prev + 1);
        resetField();
      }

      const activeTarget =
        game.targetColor === "green" ? game.greenTarget : game.redTarget;
      const coveringTarget =
        distance(game.player, activeTarget) <= HEX_RADIUS - TARGET_RADIUS;
      if (coveringTarget) {
        if (captureStartedAtRef.current === null) {
          captureStartedAtRef.current = now;
        }
        const nextCaptureProgress = Math.min(
          100,
          ((now - captureStartedAtRef.current) / CAPTURE_MS) * 100,
        );
        captureProgressRef.current = nextCaptureProgress;
        setCaptureProgress(nextCaptureProgress);
      } else if (captureStartedAtRef.current !== null) {
        captureStartedAtRef.current = null;
        captureProgressRef.current = 0;
        setCaptureProgress(0);
      }

      if (now - lastRenderTime > 32) {
        lastRenderTime = now;
        setSnapshot({
          player: { ...game.player },
          redTarget: { ...game.redTarget },
          greenTarget: { ...game.greenTarget },
          targetColor: game.targetColor,
          obstacles: game.obstacles.map((obstacle) => ({ ...obstacle })),
        });
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    captureTarget,
    playTone,
    quizComplete,
    quizStarted,
    resetField,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      voicesRef.current = synth.getVoices();
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    autoMicEnabledRef.current = autoMicEnabled;
  }, [autoMicEnabled]);

  useEffect(() => {
    quizStartedRef.current = quizStarted;
  }, [quizStarted]);

  useEffect(() => {
    quizCompleteRef.current = quizComplete;
  }, [quizComplete]);

  useEffect(() => {
    startVoiceRecognitionRef.current = (cancelSpeech = false) => {
      void startVoiceRecognition(cancelSpeech);
    };
  }, [startVoiceRecognition]);

  const correctCount = answers.filter((answerData) => answerData.isCorrect).length;
  useRecordRealModeScore({
    completed: quizComplete,
    mode,
    topicSlug: "joy-stick-game",
    topicTitle: "Joy-Stick Game",
    score: correctCount,
    maxScore: questions.length,
    questionCount: questions.length,
    timeTakenSeconds: totalTimeTaken,
    metadata: { targetCaptures, obstacleHits, obstacleSpeed, obstacleCount, sensitivity },
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current?.close();
      window.speechSynthesis?.cancel();
      if (voiceSubmitTimerRef.current) {
        clearTimeout(voiceSubmitTimerRef.current);
      }
      recognitionRef.current?.abort();
      speechUtteranceRef.current = null;
    };
  }, []);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#4F12A6] border-r-transparent" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <TopicLayout
        title="Joy-Stick Game"
        description="Flight control, target capture, obstacle avoidance, and mental math."
        fullWidth={false}
      >
        <ResultsScreen
          questions={questions}
          answers={answers}
          targetCaptures={targetCaptures}
          obstacleHits={obstacleHits}
          timeTaken={totalTimeTaken}
          onRestart={onRestart}
        />
      </TopicLayout>
    );
  }

  const questionTextSize =
    currentQuestion.expression.length > 80
      ? "text-[20px] sm:text-[24px]"
      : "text-[34px] sm:text-[42px]";
  const captureReady = captureProgress >= 100;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F1F5F9] dark:bg-transparent">
      {startCountdown !== null ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/10 backdrop-blur-[1px]">
          <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/80 bg-brand-purple text-7xl font-black text-white shadow-2xl shadow-brand-purple/30 dark:border-brand-gold/70 dark:bg-black">
            {startCountdown}
          </div>
        </div>
      ) : null}
      <div className="mx-auto mb-10 w-full max-w-[1560px] flex-1 p-3 pt-8 sm:p-4 sm:pt-10">
        <div className="mb-4 flex flex-col gap-4 rounded-2xl border-2 border-zinc-200 bg-white px-5 py-4 dark:border-white/5 dark:bg-black/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">
              Joy-Stick Game
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-400 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900">
                {mode === "real" ? "REAL MODE" : "LEARN MODE"}
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                {gamepadConnected ? "JOYSTICK READY" : "WASD + SPACE"}
              </span>
              <span
                className={`rounded-md px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.12em] ${
                  snapshot.targetColor === "green"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200"
                }`}
              >
                Capture {snapshot.targetColor}
              </span>
            </div>
          </div>
          <div className="text-[24px] font-bold text-zinc-900 dark:text-white/90">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="rounded-2xl border-2 border-[#E2EAF0] bg-white p-4 dark:border-white/5 dark:bg-black/20">
            <div
              className="relative min-h-[min(68vh,760px)] w-full overflow-hidden rounded-xl border-2 border-zinc-900 bg-slate-50 shadow-inner dark:border-white/20 dark:bg-zinc-950"
              style={{ aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
              <div
                className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-lg ${
                  snapshot.targetColor === "red" ? "ring-4 ring-red-200" : ""
                }`}
                style={{
                  left: `${(snapshot.redTarget.x / FIELD_WIDTH) * 100}%`,
                  top: `${(snapshot.redTarget.y / FIELD_HEIGHT) * 100}%`,
                }}
              />
              <div
                className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-lg ${
                  snapshot.targetColor === "green" ? "ring-4 ring-emerald-200" : ""
                }`}
                style={{
                  left: `${(snapshot.greenTarget.x / FIELD_WIDTH) * 100}%`,
                  top: `${(snapshot.greenTarget.y / FIELD_HEIGHT) * 100}%`,
                }}
              />
              {snapshot.obstacles.map((obstacle, index) => (
                <div
                  key={index}
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950 shadow-md dark:bg-white"
                  style={{
                    left: `${(obstacle.x / FIELD_WIDTH) * 100}%`,
                    top: `${(obstacle.y / FIELD_HEIGHT) * 100}%`,
                  }}
                />
              ))}
              <div
                className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 bg-brand-purple shadow-xl shadow-brand-purple/30"
                style={{
                  left: `${(snapshot.player.x / FIELD_WIDTH) * 100}%`,
                  top: `${(snapshot.player.y / FIELD_HEIGHT) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${snapshot.player.angle + Math.PI / 2}rad)`,
                  clipPath:
                    "polygon(50% 0%, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%)",
                }}
              />
              {!quizStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/85 p-5 text-center backdrop-blur-sm dark:bg-black/75">
                  <div className="max-w-3xl">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-300">
                      Pre-flight instructions
                    </p>
                    <h2 className="mb-5 text-3xl font-bold text-zinc-900 dark:text-white">
                      Fly the hexagon, capture the active color, avoid obstacles.
                    </h2>
                    <div className="mb-6 grid gap-3 text-left sm:grid-cols-2">
                      <div className="rounded-xl border-2 border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          Controls
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          Hold W to accelerate forward. Press S to brake. Use A
                          and D to rotate. Space captures when ready.
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          Target
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          Red and green dots are both on screen. Capture only
                          the color shown in the header.
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          Capture
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          Cover the active dot completely for 1.5 seconds, then
                          press Space or the Capture button.
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          Questions
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          Answer the math prompts while flying. Obstacles reset
                          the field and change the active target.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={startQuiz}
                      disabled={startCountdown !== null}
                      className="rounded-xl bg-brand-purple px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-400"
                    >
                      {startCountdown === null ? "Start Flight" : "Get Ready"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Obstacle Speed <b className="text-zinc-900 dark:text-white">{obstacleSpeed.toFixed(1)}</b>
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.2}
                  value={obstacleSpeed}
                  onChange={(event) => setObstacleSpeed(Number(event.target.value))}
                  className="mt-3 w-full accent-brand-purple"
                />
              </label>
              <label className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Obstacles <b className="text-zinc-900 dark:text-white">{obstacleCount}</b>
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={obstacleCount}
                  onChange={(event) => setObstacleCount(Number(event.target.value))}
                  className="mt-3 w-full accent-brand-purple"
                />
              </label>
              <label className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Sensitivity <b className="text-zinc-900 dark:text-white">{sensitivity.toFixed(1)}</b>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={sensitivity}
                  onChange={(event) => setSensitivity(Number(event.target.value))}
                  className="mt-3 w-full accent-brand-purple"
                />
              </label>
            </div>
          </div>

          <aside className="rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/5 dark:bg-black/40">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={enableAudio}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  audioEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200"
                    : "bg-brand-purple text-white hover:opacity-90"
                }`}
              >
                {audioEnabled ? "Sound On" : "Enable Sound"}
              </button>
              <button
                onClick={() => {
                  const nextSpeechEnabled = !speechEnabled;
                  setSpeechEnabled(nextSpeechEnabled);
                  if (!nextSpeechEnabled) {
                    window.speechSynthesis?.cancel();
                    setSpeechStatus("Voice off");
                    return;
                  }
                  speakQuestion(true);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  speechEnabled
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
                }`}
              >
                {speechEnabled ? "Voice On" : "Voice Off"}
              </button>
              <button
                onClick={() => speakQuestion(true)}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
              >
                Repeat
              </button>
              {VOICE_INPUT_ENABLED && voiceInputAvailable ? (
                <div className="rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                  Hold B to answer
                </div>
              ) : null}
            </div>

            {VOICE_INPUT_ENABLED && voiceBrowserWarning ? (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
                {voiceBrowserWarning}
              </div>
            ) : null}

            <div className="mb-5 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-purple transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Time Left
                </p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
                  {remainingSeconds}s
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Capture
                </p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
                  {Math.round(captureProgress)}%
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                  Targets
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {targetCaptures}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-700 dark:text-red-300">
                  Obstacle Hits
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {obstacleHits}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {currentQuestion.prompt}
                </p>
                <button
                  onClick={() => setShowQuestionPopup((prev) => !prev)}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200"
                >
                  {showQuestionPopup ? "Hide" : "Show"}
                </button>
              </div>
              {showQuestionPopup ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-xl border-2 border-[#4F12A6] bg-white px-3 py-4 dark:border-white/90 dark:bg-zinc-900/80">
                  <span
                    className={`break-words text-center font-bold text-zinc-900 dark:text-white ${questionTextSize}`}
                  >
                    {currentQuestion.expression}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => speakQuestion(true)}
                  className="flex min-h-[120px] w-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm font-bold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                >
                  Hear Question
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                inputMode="numeric"
                pattern="-?[0-9]*"
                autoFocus
                placeholder="Type answer"
                disabled={!quizStarted}
                className="min-h-12 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 text-lg font-bold text-zinc-900 outline-none transition focus:border-brand-purple dark:border-white/10 dark:bg-zinc-950 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={!quizStarted || !answer.trim()}
                  className="min-h-12 rounded-xl bg-brand-purple px-4 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
                >
                  Answer
                </button>
                <button
                  type="button"
                  onClick={captureTarget}
                  disabled={!quizStarted || !captureReady}
                  className="min-h-12 rounded-xl bg-zinc-900 px-4 text-lg font-bold text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Capture
                </button>
              </div>
            </form>

            <p className="mt-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {speechStatus}
              {VOICE_INPUT_ENABLED && voiceInputAvailable
                ? ` · ${voiceInputStatus}`
                : ""}
              {VOICE_INPUT_ENABLED && voiceInputAvailable
                ? " · Hold B for voice"
                : ""} · W starts,
              S stops, A/D rotate, Space captures.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
