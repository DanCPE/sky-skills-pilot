import type {
  PassageRecallQuestion,
  PassageRecallQuizResponse,
} from "@/types";

const READING_DURATION_SECONDS = 120;

const SOURCE_LIBRARY = {
  CALLSIGNS: [
    "SKYJET",
    "NAVAIR",
    "EAGLE",
    "THAIJET",
    "PACIFIC",
    "AEROSTAR",
    "FALCON",
    "ORBIT",
    "JETLINK",
    "CARGOLUX",
  ],
  FLIGHT_NUMBERS: [
    "218",
    "307",
    "452",
    "518",
    "624",
    "731",
    "846",
    "903",
    "117",
    "265",
  ],
  AIRPORTS: [
    "Bangkok",
    "Singapore",
    "Dubai",
    "Doha",
    "Sydney",
    "Frankfurt",
    "Tokyo",
    "Seoul",
    "Amsterdam",
    "Vienna",
  ],
  WAYPOINTS: [
    "DAGNO",
    "VIMUT",
    "SUKAT",
    "RENOB",
    "KIPRA",
    "MELAS",
    "TARUN",
    "DOGPO",
    "ABTOK",
    "LAVAX",
  ],
  FL_LEVELS: [
    "FL180",
    "FL200",
    "FL220",
    "FL240",
    "FL260",
    "FL280",
    "FL300",
    "FL320",
    "FL340",
    "FL360",
  ],
  HEADINGS: [
    "030",
    "045",
    "090",
    "120",
    "145",
    "180",
    "210",
    "240",
    "275",
    "330",
  ],
  RUNWAYS: [
    "05L",
    "07R",
    "09",
    "12L",
    "16R",
    "18",
    "22L",
    "25R",
    "27",
    "34L",
  ],
  SQUAWKS: [
    "3021",
    "4175",
    "5214",
    "6042",
    "7153",
    "4412",
    "5530",
    "2664",
    "3705",
    "4826",
  ],
  SPEEDS: [
    "210 knots",
    "220 knots",
    "230 knots",
    "240 knots",
    "250 knots",
    "260 knots",
    "270 knots",
    "280 knots",
    "290 knots",
    "300 knots",
  ],
  FREQUENCIES: [
    "118.10",
    "119.25",
    "120.45",
    "121.80",
    "122.70",
    "123.95",
    "124.30",
    "125.60",
    "126.85",
    "127.40",
  ],
} as const satisfies Record<string, readonly string[]>;

type LibraryKey = keyof typeof SOURCE_LIBRARY;

const PASSAGE_TEMPLATES = [
  {
    id: "arrival-sequence",
    questionContext: "during the arrival sequence",
    text: "Callsign [CALLSIGNS] flight [FLIGHT_NUMBERS] is inbound to [AIRPORTS]. The crew is cleared direct [WAYPOINTS], maintain [FL_LEVELS], reduce to [SPEEDS], turn left heading [HEADINGS], contact approach on [FREQUENCIES], expect runway [RUNWAYS], and squawk [SQUAWKS].",
  },
  {
    id: "departure-clearance",
    questionContext: "during the departure clearance",
    text: "Before departure to [AIRPORTS], [CALLSIGNS] [FLIGHT_NUMBERS] receives a clearance to climb initially [FL_LEVELS], proceed via [WAYPOINTS], fly heading [HEADINGS], maintain [SPEEDS], contact departure on [FREQUENCIES], expect runway [RUNWAYS], and set squawk [SQUAWKS].",
  },
  {
    id: "vector-to-final",
    questionContext: "during vectors to final",
    text: "During vectors for arrival at [AIRPORTS], [CALLSIGNS] [FLIGHT_NUMBERS] is instructed to continue toward [WAYPOINTS], descend and maintain [FL_LEVELS], slow to [SPEEDS], turn heading [HEADINGS], switch to tower on [FREQUENCIES], land runway [RUNWAYS], and remain on squawk [SQUAWKS].",
  },
  {
    id: "holding-brief",
    questionContext: "during the holding brief",
    text: "While preparing for a delay into [AIRPORTS], flight [CALLSIGNS] [FLIGHT_NUMBERS] is told to hold over [WAYPOINTS], remain at [FL_LEVELS], expect further clearance on [FREQUENCIES], keep [SPEEDS], plan for runway [RUNWAYS], maintain heading [HEADINGS], and continue squawk [SQUAWKS].",
  },
  {
    id: "handoff-sequence",
    questionContext: "during the handoff sequence",
    text: "[CALLSIGNS] [FLIGHT_NUMBERS] is being handed off near [WAYPOINTS] en route to [AIRPORTS]. The aircraft is level at [FL_LEVELS], tracking heading [HEADINGS], maintaining [SPEEDS], changing to frequency [FREQUENCIES], expecting runway [RUNWAYS], and identified with squawk [SQUAWKS].",
  },
];

const QUESTION_LABELS: Partial<Record<LibraryKey, string>> = {
  CALLSIGNS: "the callsign",
  FLIGHT_NUMBERS: "the flight number",
  AIRPORTS: "the destination airport",
  WAYPOINTS: "the waypoint",
  FL_LEVELS: "the assigned flight level",
  HEADINGS: "the assigned heading",
  RUNWAYS: "the runway",
  SQUAWKS: "the squawk code",
  SPEEDS: "the assigned speed",
  FREQUENCIES: "the radio frequency",
};

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function sampleOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function titleFromPlaceholder(placeholder: string): string {
  return placeholder
    .toLowerCase()
    .split("_")
    .join(" ")
    .replace(/s$/, "");
}

function buildQuestionPrompt(placeholder: LibraryKey): string {
  const label = QUESTION_LABELS[placeholder] ?? titleFromPlaceholder(placeholder);
  return `What was ${label}?`;
}

function buildSegmentQuestionPrompt(
  placeholder: LibraryKey,
  context: string,
): string {
  return `${context.charAt(0).toUpperCase()}${context.slice(1)}, ${buildQuestionPrompt(
    placeholder,
  ).toLowerCase()}`;
}

function buildDistractors(
  placeholder: LibraryKey,
  correctAnswer: string,
): string[] {
  const pool = shuffleArray(
    SOURCE_LIBRARY[placeholder].filter((value) => value !== correctAnswer),
  );

  return pool.slice(0, 3);
}

export function generatePassageRecallQuiz(): PassageRecallQuizResponse {
  const selectedTemplates = shuffleArray(PASSAGE_TEMPLATES).slice(0, 3);
  const passageParts: string[] = [];
  const questions: PassageRecallQuestion[] = [];
  const transitionPhrases = [
    "Shortly afterward,",
    "A little later,",
    "As the operation continues,",
  ];

  selectedTemplates.forEach((template) => {
    const placeholderMatches = Array.from(
      new Set(
        [...template.text.matchAll(/\[([A-Z_]+)\]/g)].map(
          (match) => match[1] as LibraryKey,
        ),
      ),
    );

    const sessionKey = placeholderMatches.reduce(
      (accumulator, placeholder) => {
        accumulator[placeholder] = sampleOne(SOURCE_LIBRARY[placeholder]);
        return accumulator;
      },
      {} as Record<LibraryKey, string>,
    );

    const segmentPassage = template.text.replaceAll(
      /\[([A-Z_]+)\]/g,
      (_match, key: string) => sessionKey[key as LibraryKey],
    );

    passageParts.push(segmentPassage);

    placeholderMatches.forEach((placeholder) => {
      const correctAnswer = sessionKey[placeholder];
      const distractors = buildDistractors(placeholder, correctAnswer);

      questions.push({
        id: generateId("prq"),
        prompt: buildSegmentQuestionPrompt(placeholder, template.questionContext),
        options: shuffleArray([correctAnswer, ...distractors]),
        correctAnswer,
        placeholder,
      });
    });
  });

  const passage = passageParts
    .map((part, index) => (index === 0 ? part : `${transitionPhrases[index - 1]} ${part.charAt(0).toLowerCase()}${part.slice(1)}`))
    .join(" ");

  return {
    id: generateId("session"),
    templateId: selectedTemplates.map((template) => template.id).join("__"),
    passage,
    questions,
    readingDurationSeconds: READING_DURATION_SECONDS,
  };
}
