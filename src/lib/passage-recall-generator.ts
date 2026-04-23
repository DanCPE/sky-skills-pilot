import type {
  PassageRecallQuestion,
  PassageRecallQuizResponse,
  ShortTermMemoryMathQuestion,
} from "@/types";

const READING_DURATION_SECONDS = 120;
const PASSENGER_COUNTS = [
  "12",
  "18",
  "24",
  "31",
  "37",
  "43",
  "49",
  "56",
  "62",
  "74",
] as const;
const ROUTE_CITIES = [
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
] as const;

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
  INITIAL_CITIES: ROUTE_CITIES,
  DESTINATION_CITIES: [
    "London",
    "Paris",
    "Zurich",
    "Melbourne",
    "Hong Kong",
    "Madrid",
    "Rome",
    "Istanbul",
    "Copenhagen",
    "Auckland",
  ],
  STOP_CITY_1: [
    "Chiang Mai",
    "Hanoi",
    "Manila",
    "Kuala Lumpur",
    "Jakarta",
    "Taipei",
    "Colombo",
    "Phuket",
    "Da Nang",
    "Ho Chi Minh City",
  ],
  STOP_CITY_2: [
    "Muscat",
    "Abu Dhabi",
    "Riyadh",
    "Kuwait City",
    "Bahrain",
    "Jeddah",
    "Sharjah",
    "Salalah",
    "Dammam",
    "Medina",
  ],
  STOP_CITY_3: [
    "Athens",
    "Milan",
    "Prague",
    "Munich",
    "Warsaw",
    "Lisbon",
    "Brussels",
    "Stockholm",
    "Oslo",
    "Helsinki",
  ],
  STOP1_PAX_IN: PASSENGER_COUNTS,
  STOP1_PAX_OUT: PASSENGER_COUNTS,
  STOP2_PAX_IN: PASSENGER_COUNTS,
  STOP2_PAX_OUT: PASSENGER_COUNTS,
  STOP3_PAX_IN: PASSENGER_COUNTS,
  STOP3_PAX_OUT: PASSENGER_COUNTS,
  EMERGENCY_INCIDENTS: [
    "a cabin smoke warning",
    "a hydraulic pressure alert",
    "a passenger medical emergency",
    "a bird strike report",
    "an engine vibration caution",
    "a cargo hold temperature warning",
    "a fuel imbalance alert",
    "a pressurization caution",
    "a brake temperature warning",
    "an avionics cooling fault",
  ],
  FLIGHT_SUMMARIES: [
    "landed safely with a minor arrival delay",
    "completed the route after maintenance checks",
    "continued normally after crew coordination",
    "arrived with priority handling from approach",
    "completed all stops with revised timing",
    "finished the sector after a short ground inspection",
    "landed safely and filed an operations report",
    "arrived with all passengers transferred successfully",
    "continued under normal procedures after the incident",
    "completed the flight with no further abnormalities",
  ],
} as const satisfies Record<string, readonly string[]>;

type LibraryKey = keyof typeof SOURCE_LIBRARY;

interface PassageSegment {
  id: string;
  text: string;
  questions: PassageRecallQuestion[];
}

interface RecallFact {
  key: LibraryKey;
  value: string;
  prompt: string;
  placeholder?: string;
}

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
  INITIAL_CITIES: "the initial city",
  DESTINATION_CITIES: "the final destination",
  STOP_CITY_1: "the first stop city",
  STOP_CITY_2: "the second stop city",
  STOP_CITY_3: "the third stop city",
  STOP1_PAX_IN: "the number of passengers boarding at the first stop",
  STOP1_PAX_OUT: "the number of passengers leaving at the first stop",
  STOP2_PAX_IN: "the number of passengers boarding at the second stop",
  STOP2_PAX_OUT: "the number of passengers leaving at the second stop",
  STOP3_PAX_IN: "the number of passengers boarding at the third stop",
  STOP3_PAX_OUT: "the number of passengers leaving at the third stop",
  EMERGENCY_INCIDENTS: "the emergency incident",
  FLIGHT_SUMMARIES: "the final flight summary",
};

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function sampleOne<T>(items: readonly T[]): T {
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

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function buildMathDistractors(correctAnswer: number): number[] {
  const distractors = new Set<number>();

  while (distractors.size < 3) {
    const offset = randomInt(15) + 1;
    const candidate = correctAnswer + (randomInt(2) === 0 ? offset : -offset);
    if (candidate >= 0 && candidate !== correctAnswer) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function generateMathQuestion(index: number): ShortTermMemoryMathQuestion {
  const operators = ["+", "-", "×"] as const;
  const operator = operators[randomInt(operators.length)];
  const left = randomInt(18) + 7;
  const right = operator === "×" ? randomInt(8) + 2 : randomInt(18) + 3;
  const normalizedLeft = operator === "-" ? Math.max(left, right) : left;
  const normalizedRight = operator === "-" ? Math.min(left, right) : right;

  const correctAnswer =
    operator === "+"
      ? normalizedLeft + normalizedRight
      : operator === "-"
        ? normalizedLeft - normalizedRight
        : normalizedLeft * normalizedRight;

  return {
    id: `pr-math-${index}-${randomInt(100000)}`,
    prompt: `${normalizedLeft} ${operator} ${normalizedRight} = ?`,
    options: shuffleArray([correctAnswer, ...buildMathDistractors(correctAnswer)]).map(String),
    correctAnswer: String(correctAnswer),
  };
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

function buildRecallQuestion({
  key,
  value,
  prompt,
  placeholder,
}: RecallFact): PassageRecallQuestion {
  return {
    id: generateId("prq"),
    prompt,
    options: shuffleArray([value, ...buildDistractors(key, value)]),
    correctAnswer: value,
    placeholder: placeholder ?? key,
  };
}

function sampleFact(key: LibraryKey): string {
  return sampleOne(SOURCE_LIBRARY[key]);
}

function buildFlightRouteSegment(): PassageSegment {
  const flight = {
    callsign: sampleFact("CALLSIGNS"),
    flightNumber: sampleFact("FLIGHT_NUMBERS"),
    flightLevel: sampleFact("FL_LEVELS"),
    initialCity: sampleFact("INITIAL_CITIES"),
    destinationCity: sampleFact("DESTINATION_CITIES"),
    firstStop: sampleFact("STOP_CITY_1"),
    secondStop: sampleFact("STOP_CITY_2"),
    thirdStop: sampleFact("STOP_CITY_3"),
    firstStopPassengerIn: sampleFact("STOP1_PAX_IN"),
    firstStopPassengerOut: sampleFact("STOP1_PAX_OUT"),
    secondStopPassengerIn: sampleFact("STOP2_PAX_IN"),
    secondStopPassengerOut: sampleFact("STOP2_PAX_OUT"),
    thirdStopPassengerIn: sampleFact("STOP3_PAX_IN"),
    thirdStopPassengerOut: sampleFact("STOP3_PAX_OUT"),
    emergencyIncident: sampleFact("EMERGENCY_INCIDENTS"),
    summary: sampleFact("FLIGHT_SUMMARIES"),
  };

  const text = [
    `Flight ${flight.callsign} ${flight.flightNumber} started in ${flight.initialCity} and was cleared at ${flight.flightLevel} for the cruise toward ${flight.destinationCity}.`,
    `The planned route had three stop cities before the final destination: ${flight.firstStop}, ${flight.secondStop}, and ${flight.thirdStop}.`,
    `At ${flight.firstStop}, ${flight.firstStopPassengerIn} passengers boarded and ${flight.firstStopPassengerOut} passengers left the aircraft.`,
    `At ${flight.secondStop}, ${flight.secondStopPassengerIn} passengers boarded while ${flight.secondStopPassengerOut} passengers disembarked.`,
    `At ${flight.thirdStop}, ${flight.thirdStopPassengerIn} passengers boarded and ${flight.thirdStopPassengerOut} passengers got off before the final sector.`,
    `During the route, the crew handled ${flight.emergencyIncident}.`,
    `The flight summary recorded that the aircraft ${flight.summary}.`,
  ].join(" ");

  const facts: RecallFact[] = [
    {
      key: "CALLSIGNS",
      value: flight.callsign,
      prompt: "In the flight route summary, what was the callsign?",
    },
    {
      key: "FLIGHT_NUMBERS",
      value: flight.flightNumber,
      prompt: "In the flight route summary, what was the flight number?",
    },
    {
      key: "FL_LEVELS",
      value: flight.flightLevel,
      prompt: "In the flight route summary, what flight level was assigned?",
    },
    {
      key: "INITIAL_CITIES",
      value: flight.initialCity,
      prompt: "In the flight route summary, what was the initial city?",
    },
    {
      key: "DESTINATION_CITIES",
      value: flight.destinationCity,
      prompt: "In the flight route summary, what was the final destination?",
    },
    {
      key: "STOP_CITY_1",
      value: flight.firstStop,
      prompt: "In the flight route summary, what was the first stop city?",
    },
    {
      key: "STOP_CITY_2",
      value: flight.secondStop,
      prompt: "In the flight route summary, what was the second stop city?",
    },
    {
      key: "STOP_CITY_3",
      value: flight.thirdStop,
      prompt: "In the flight route summary, what was the third stop city?",
    },
    {
      key: "STOP1_PAX_IN",
      value: flight.firstStopPassengerIn,
      prompt: "How many passengers boarded at the first stop?",
    },
    {
      key: "STOP1_PAX_OUT",
      value: flight.firstStopPassengerOut,
      prompt: "How many passengers left at the first stop?",
    },
    {
      key: "STOP2_PAX_IN",
      value: flight.secondStopPassengerIn,
      prompt: "How many passengers boarded at the second stop?",
    },
    {
      key: "STOP2_PAX_OUT",
      value: flight.secondStopPassengerOut,
      prompt: "How many passengers left at the second stop?",
    },
    {
      key: "STOP3_PAX_IN",
      value: flight.thirdStopPassengerIn,
      prompt: "How many passengers boarded at the third stop?",
    },
    {
      key: "STOP3_PAX_OUT",
      value: flight.thirdStopPassengerOut,
      prompt: "How many passengers left at the third stop?",
    },
    {
      key: "EMERGENCY_INCIDENTS",
      value: flight.emergencyIncident,
      prompt: "What emergency incident did the crew handle?",
    },
    {
      key: "FLIGHT_SUMMARIES",
      value: flight.summary,
      prompt: "What was recorded in the final flight summary?",
    },
  ];

  return {
    id: "multi-stop-flight-summary",
    text,
    questions: facts.map(buildRecallQuestion),
  };
}

function buildTemplateSegment(template: (typeof PASSAGE_TEMPLATES)[number]): PassageSegment {
  const placeholderMatches = Array.from(
    new Set(
      [...template.text.matchAll(/\[([A-Z_]+)\]/g)].map(
        (match) => match[1] as LibraryKey,
      ),
    ),
  );

  const sessionKey = placeholderMatches.reduce(
    (accumulator, placeholder) => {
      accumulator[placeholder] = sampleFact(placeholder);
      return accumulator;
    },
    {} as Record<LibraryKey, string>,
  );

  const text = template.text.replaceAll(
    /\[([A-Z_]+)\]/g,
    (_match, key: string) => sessionKey[key as LibraryKey],
  );

  return {
    id: template.id,
    text,
    questions: placeholderMatches.map((placeholder) =>
      buildRecallQuestion({
        key: placeholder,
        value: sessionKey[placeholder],
        prompt: buildSegmentQuestionPrompt(placeholder, template.questionContext),
      }),
    ),
  };
}

function joinPassageSegments(segments: PassageSegment[]): string {
  const transitionPhrases = [
    "Shortly afterward,",
    "A little later,",
    "As the operation continues,",
  ];

  return segments
    .map((segment, index) =>
      index === 0
        ? segment.text
        : `${transitionPhrases[index - 1]} ${segment.text.charAt(0).toLowerCase()}${segment.text.slice(1)}`,
    )
    .join(" ");
}

export function generatePassageRecallQuiz(): PassageRecallQuizResponse {
  const segments = shuffleArray([
    buildFlightRouteSegment(),
    ...shuffleArray(PASSAGE_TEMPLATES).slice(0, 2).map(buildTemplateSegment),
  ]);
  const questions = segments.flatMap((segment) => segment.questions);

  return {
    id: generateId("session"),
    templateId: segments.map((segment) => segment.id).join("__"),
    passage: joinPassageSegments(segments),
    questions,
    readingDurationSeconds: READING_DURATION_SECONDS,
    mathQuestions: Array.from({ length: 3 }, (_, index) => generateMathQuestion(index)),
  };
}
