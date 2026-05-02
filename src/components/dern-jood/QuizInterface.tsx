"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import TopicLayout from "@/components/TopicLayout";
import ResultsScreen from "./ResultsScreen";
import type { DernJoodQuizResponse } from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface QuizInterfaceProps {
  quizData: DernJoodQuizResponse;
  onRestart: () => void;
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

function isRepeatCommand(transcript: string): boolean {
  return /\b(repeat|say again|again|one more time)\b/i.test(transcript);
}

export default function QuizInterface({
  quizData,
  onRestart,
}: QuizInterfaceProps) {
  const router = useRouter();
  const { questions, mode } = quizData;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(
    questions[0]?.timeLimitSeconds ?? 0,
  );
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechStatus, setSpeechStatus] = useState("Voice ready");
  const [isListening, setIsListening] = useState(false);
  const [autoMicEnabled, setAutoMicEnabled] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState("Mic ready");
  const [showQuestionPopup, setShowQuestionPopup] = useState(true);
  const [learnBpm, setLearnBpm] = useState(quizData.bpm ?? questions[0]?.bpm ?? 90);
  const [realBpm, setRealBpm] = useState(questions[0]?.bpm ?? 90);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number | undefined>();
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(
    new Set(),
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedQuestionIdsRef = useRef<Set<string>>(new Set());
  const quizStartTimeRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef<number | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenQuestionIdRef = useRef<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const realBpmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoMicEnabledRef = useRef(false);
  const quizStartedRef = useRef(false);
  const quizCompleteRef = useRef(false);
  const startVoiceRecognitionRef = useRef<(() => void) | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const effectiveBpm = mode === "learn" ? learnBpm : realBpm;
  const progress = useMemo(() => {
    if (!currentQuestion) return 0;
    return Math.max(
      0,
      Math.min(100, (remainingSeconds / currentQuestion.timeLimitSeconds) * 100),
    );
  }, [currentQuestion, remainingSeconds]);

  const stopMetronome = () => {
    if (metronomeTimerRef.current) {
      clearInterval(metronomeTimerRef.current);
      metronomeTimerRef.current = null;
    }
  };

  const randomBpm = () => Math.round((Math.floor(Math.random() * 131) + 50) / 5) * 5;

  const stopRealBpmTimer = () => {
    if (realBpmTimerRef.current) {
      clearTimeout(realBpmTimerRef.current);
      realBpmTimerRef.current = null;
    }
  };

  const playTick = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || audioContext.state !== "running") return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(920, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.06);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.07);
  };

  const enableAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    await audioContextRef.current.resume();
    setAudioEnabled(true);
    playTick();
  };

  const formatExpressionForSpeech = (expression: string) =>
    expression
      .replace(/\bFL(\d+)\b/g, " flight level $1 ")
      .replaceAll("ft/min", " feet per minute ")
      .replaceAll("×", " times ")
      .replaceAll("÷", " divided by ")
      .replaceAll("+", " plus ")
      .replaceAll("-", " minus ");

  const scheduleAutoMic = useCallback(() => {
    if (
      !autoMicEnabledRef.current ||
      !quizStartedRef.current ||
      quizCompleteRef.current
    ) {
      return;
    }

    setTimeout(() => {
      startVoiceRecognitionRef.current?.();
    }, 250);
  }, []);

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

    const utterance = new SpeechSynthesisUtterance(
      `What is ${formatExpressionForSpeech(currentQuestion.expression)}?`,
    );
    const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
    const englishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ?? voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.lang = englishVoice?.lang ?? "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeechStatus("Speaking question");
    utterance.onend = () => {
      setSpeechStatus("Voice ready");
      scheduleAutoMic();
    };
    utterance.onerror = (e) => {
      if (e.error === "canceled") {
        setSpeechStatus("Voice blocked by browser — try Edge or Chrome");
      } else {
        setSpeechStatus(`Voice error: ${e.error}`);
      }
      scheduleAutoMic();
    };
    speechUtteranceRef.current = utterance;

    // Cancel any ongoing speech, then delay before speaking to avoid Chrome's
    // cancel+speak race condition where the new utterance gets silently dropped.
    synth.cancel();
    setTimeout(() => {
      if (speechUtteranceRef.current === utterance) {
        window.speechSynthesis?.resume();
        window.speechSynthesis?.speak(utterance);
      }
    }, 50);

    return true;
  }, [currentQuestion, scheduleAutoMic, speechEnabled]);

  const startQuiz = async () => {
    if (quizStarted) return;
    if (quizStartTimeRef.current === null) {
      quizStartTimeRef.current = Date.now();
    }
    questionStartedAtRef.current = Date.now();
    setRemainingSeconds(currentQuestion.timeLimitSeconds);
    setQuizStarted(true);
    if (speechEnabled) {
      speakQuestion(true);
    }
    await enableAudio();
  };

  const stopVoiceRecognition = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
    setVoiceInputStatus(autoMicEnabledRef.current ? "Mic auto paused" : "Mic ready");
  };

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
    recognitionRef.current?.abort();
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
    setAnsweredQuestionIds((prev) => new Set([...prev, currentQuestion.id]));
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer.trim()) return;
    recordAnswer(answer);
  };

  const startVoiceRecognition = useCallback(async () => {
    if (!quizStarted || quizComplete || !currentQuestion || isListening) return;
    if (typeof window === "undefined") return;

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
      window.speechSynthesis?.cancel();
      const recognition = createRecognition(processLocally);

      const fallbackToRepeat = (message: string) => {
        recognitionRef.current?.abort();
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
        const transcript = result[0]?.transcript.trim() ?? "";
        if (!transcript) {
          fallbackToRepeat("Heard nothing. Repeating question");
          return;
        }

        setVoiceInputStatus(`Heard: ${transcript}`);

        if (isRepeatCommand(transcript)) {
          recognitionRef.current?.abort();
          recognitionRef.current = null;
          setIsListening(false);
          setVoiceInputStatus("Repeating question");
          speakQuestion(true);
          return;
        }

        const parsedAnswer = parseSpokenNumber(transcript);
        if (!parsedAnswer) {
          if (result.isFinal) {
            fallbackToRepeat(`Could not answer: ${transcript}. Repeating question`);
          }
          return;
        }

        setAnswer(parsedAnswer);
        setVoiceInputStatus(`Submitting: ${parsedAnswer}`);
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        setIsListening(false);
        recordAnswer(parsedAnswer);
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
    recordAnswer,
    speakQuestion,
  ]);

  useEffect(() => {
    if (!currentQuestion || quizComplete || !quizStarted) return;

    if (quizStartTimeRef.current === null) {
      quizStartTimeRef.current = Date.now();
    }

    questionStartedAtRef.current = Date.now();
    let speechTimer: ReturnType<typeof setTimeout> | null = null;
    if (speechEnabled) {
      speechTimer = setTimeout(() => speakQuestion(), 80);
    } else if (autoMicEnabled) {
      speechTimer = setTimeout(() => startVoiceRecognitionRef.current?.(), 250);
    }

    return () => {
      if (speechTimer) {
        clearTimeout(speechTimer);
      }
    };
  }, [
    autoMicEnabled,
    currentQuestion,
    quizComplete,
    quizStarted,
    speechEnabled,
    speakQuestion,
  ]);

  useEffect(() => {
    if (!currentQuestion || quizComplete || !quizStarted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          recordAnswer("");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizComplete, quizStarted, recordAnswer]);

  useEffect(() => {
    stopMetronome();

    if (!currentQuestion || quizComplete || !quizStarted || !audioEnabled) {
      return stopMetronome;
    }

    const intervalMs = (60 / effectiveBpm) * 1000;
    playTick();
    metronomeTimerRef.current = setInterval(playTick, intervalMs);

    return stopMetronome;
  }, [currentQuestion, audioEnabled, quizComplete, quizStarted, effectiveBpm]);

  useEffect(() => {
    stopRealBpmTimer();

    if (mode !== "real" || quizComplete || !quizStarted) {
      return stopRealBpmTimer;
    }

    const scheduleNextBpmChange = () => {
      const nextDelayMs = (Math.floor(Math.random() * 9) + 8) * 1000;
      realBpmTimerRef.current = setTimeout(() => {
        setRealBpm(randomBpm());
        scheduleNextBpmChange();
      }, nextDelayMs);
    };

    scheduleNextBpmChange();

    return stopRealBpmTimer;
  }, [mode, quizComplete, quizStarted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const loadVoices = () => { voicesRef.current = synth.getVoices(); };
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
    startVoiceRecognitionRef.current = () => {
      void startVoiceRecognition();
    };
  }, [startVoiceRecognition]);

  useEffect(() => {
    return () => {
      stopMetronome();
      audioContextRef.current?.close();
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
      stopRealBpmTimer();
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
        title="Dern-Jood"
        description="Mental math under a metronome beat."
        fullWidth={false}
      >
        <ResultsScreen
          questions={questions}
          answers={answers}
          timeTaken={totalTimeTaken}
          onRestart={onRestart}
        />
      </TopicLayout>
    );
  }

  const questionTextSize =
    currentQuestion.expression.length > 80
      ? "text-[22px] sm:text-[28px]"
      : "text-[42px] sm:text-[56px]";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F1F5F9] dark:bg-transparent">
      <div className="mx-auto mb-20 w-full max-w-[980px] flex-1 p-4 pt-12 sm:p-6 sm:pt-16">
        <div className="mb-4 flex flex-col gap-4 rounded-2xl border-2 border-zinc-200 bg-white px-5 py-4 dark:border-white/5 dark:bg-black/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">
              Dern-Jood
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-400 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900">
                {mode === "real" ? "REAL MODE" : "LEARN MODE"}
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                {effectiveBpm} BPM
              </span>
            </div>
          </div>
          <div className="font-[family-name:var(--font-inter)] text-[24px] font-bold text-zinc-900 dark:text-white/90">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
          <div className="rounded-2xl border-2 border-[#E2EAF0] bg-white p-5 dark:border-white/5 dark:bg-black/20">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {currentQuestion.prompt}
                </p>
                <p className="mt-1 text-sm capitalize text-zinc-500 dark:text-zinc-400">
                  {currentQuestion.difficulty} difficulty
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={enableAudio}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
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
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    speechEnabled
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
                  }`}
                >
                  {speechEnabled ? "Voice On" : "Voice Off"}
                </button>
                <button
                  onClick={() => speakQuestion(true)}
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
                >
                  Repeat
                </button>
                <button
                  onClick={() => setShowQuestionPopup((prev) => !prev)}
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
                >
                  {showQuestionPopup ? "Hide Question" : "Show Question"}
                </button>
              </div>
            </div>

            <div className="mb-6 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-purple transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {showQuestionPopup ? (
              <div className="mb-8 flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-[#4F12A6] bg-white px-4 py-6 dark:border-white/90 dark:bg-zinc-900/80">
                <span
                  className={`break-words text-center font-[family-name:var(--font-space-grotesk)] font-black text-zinc-900 dark:text-white ${questionTextSize}`}
                >
                  {currentQuestion.expression}
                </span>
              </div>
            ) : (
              <div className="mb-8 flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => speakQuestion(true)}
                  className="rounded-xl bg-brand-purple px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Hear Question
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                inputMode="numeric"
                pattern="-?[0-9]*"
                autoFocus
                placeholder="Type answer"
                disabled={!quizStarted}
                className="min-h-12 flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 text-lg font-bold text-zinc-900 outline-none transition focus:border-brand-purple dark:border-white/10 dark:bg-zinc-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!quizStarted || !answer.trim()}
                className="min-h-12 rounded-xl bg-brand-purple px-8 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
              >
                Answer
              </button>
              <button
                type="button"
                onClick={() => {
                  if (autoMicEnabled) {
                    autoMicEnabledRef.current = false;
                    setAutoMicEnabled(false);
                    stopVoiceRecognition();
                    setVoiceInputStatus("Mic auto off");
                    return;
                  }

                  autoMicEnabledRef.current = true;
                  setAutoMicEnabled(true);
                  setVoiceInputStatus("Mic auto on");
                  if (
                    !speechEnabled ||
                    typeof window === "undefined" ||
                    !window.speechSynthesis?.speaking
                  ) {
                    void startVoiceRecognition();
                  }
                }}
                disabled={!quizStarted}
                className={`min-h-12 rounded-xl px-6 text-lg font-bold shadow-lg transition disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:text-white disabled:shadow-none ${
                  autoMicEnabled
                    ? "bg-red-600 text-white shadow-red-600/20 hover:bg-red-500"
                    : "bg-zinc-900 text-white shadow-zinc-900/10 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                }`}
              >
                {autoMicEnabled
                  ? isListening
                    ? "Mic Listening"
                    : "Mic Auto On"
                  : "Mic Answer"}
              </button>
            </form>

            <p className="mt-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {speechStatus} · {voiceInputStatus}
            </p>

            {!quizStarted && (
              <div className="mt-5 rounded-2xl border-2 border-brand-purple/20 bg-violet-50 p-5 text-center dark:border-brand-purple/30 dark:bg-brand-purple/10">
                <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Press Start when you are ready. The timer and metronome will begin together.
                </p>
                <button
                  onClick={startQuiz}
                  className="rounded-xl bg-brand-purple px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 active:scale-95"
                >
                  Start
                </button>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/5 dark:bg-black/40">
            {mode === "learn" && (
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="dern-jood-live-bpm"
                    className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
                  >
                    BPM
                  </label>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-black text-zinc-900 dark:text-white">
                    {learnBpm}
                  </span>
                </div>
                <input
                  id="dern-jood-live-bpm"
                  type="range"
                  min={50}
                  max={180}
                  step={5}
                  value={learnBpm}
                  onChange={(event) => setLearnBpm(Number(event.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Time Left
              </p>
              <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-4xl font-black text-zinc-900 dark:text-white">
                {remainingSeconds}s
              </p>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Score
              </p>
              <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-3xl font-black text-zinc-900 dark:text-white">
                {answers.filter((item) => item.isCorrect).length}/{answers.length}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
              {questions.map((question, index) => {
                const answered = answeredQuestionIds.has(question.id);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <div
                    key={question.id}
                    className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold ${
                      isCurrent
                        ? "bg-brand-purple text-white"
                        : answered
                          ? "bg-zinc-200 text-zinc-700 dark:bg-white/20 dark:text-white"
                          : "bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => router.back()}
              className="mt-6 w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              Exit
            </button>
          </aside>
        </div>
      </div>

      <div className="mt-auto flex w-full shrink-0 items-center justify-center bg-white py-4 dark:bg-black/40">
        <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
          © 2026 SkySkills. All rights reserved.
        </p>
      </div>
    </div>
  );
}
