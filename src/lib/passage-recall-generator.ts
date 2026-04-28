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
  "Larnaca",
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
const DEPARTURE_DATES = [
  "12 June 2016",
  "03 August 2017",
  "18 November 2018",
  "25 January 2019",
  "14 April 2020",
  "07 July 2021",
  "29 September 2022",
  "11 December 2023",
  "05 February 2024",
  "21 May 2025",
] as const;
const LOCAL_TIMES = [
  "01:35 a.m.",
  "02:10 a.m.",
  "02:40 a.m.",
  "03:25 a.m.",
  "04:40 a.m.",
  "05:15 a.m.",
  "06:05 a.m.",
  "07:20 a.m.",
  "08:45 a.m.",
  "09:30 a.m.",
  "10:55 a.m.",
] as const;
const ARRIVAL_TIMES = [
  "4:18 p.m.",
  "5:02 p.m.",
  "5:44 p.m.",
  "6:11 p.m.",
  "6:41 p.m.",
  "7:08 p.m.",
  "7:55 p.m.",
  "8:27 p.m.",
  "9:03 p.m.",
  "9:48 p.m.",
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
    "273",
    "275",
    "330",
  ],
  RUNWAYS: [
    "01L",
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
  DEPARTURE_DATES,
  DEPARTURE_TIMES: LOCAL_TIMES,
  ARRIVAL_TIMES,
  AIRCRAFT_TYPES: [
    "Airbus A350-900",
    "Boeing 787-9",
    "Airbus A330-300",
    "Boeing 777-300ER",
    "Airbus A321neo",
    "Boeing 737 MAX 8",
    "Airbus A380-800",
    "Boeing 767-300ER",
    "Airbus A320neo",
    "Boeing 747-8",
  ],
  FLIGHT_DURATIONS: [
    "8 hours 45 minutes",
    "9 hours 30 minutes",
    "10 hours 05 minutes",
    "10 hours 40 minutes",
    "11 hours 20 minutes",
    "11 hours 55 minutes",
    "12 hours 10 minutes",
    "12 hours 35 minutes",
    "13 hours 05 minutes",
    "13 hours 40 minutes",
  ],
  TOTAL_PASSENGERS: [
    "184",
    "207",
    "221",
    "245",
    "267",
    "281",
    "298",
    "314",
    "339",
    "327",
    "349",
  ],
  CABIN_CREW_COUNTS: ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
  PILOT_COUNTS: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  OVERFLIGHT_REGIONS: [
    "Kazakhstan",
    "Eastern Europe",
    "the Black Sea corridor",
    "the Caucasus",
    "Central Asia",
    "the Balkans",
    "Western China",
    "the Caspian region",
    "Northern India",
    "the Middle East",
  ],
  OPPOSITE_TRAFFIC_TYPES: [
    "Boeing 777-300ER",
    "Airbus A330-200",
    "Boeing 787-8",
    "Airbus A321",
    "Boeing 737-800",
    "Airbus A350-1000",
    "Boeing 767-300",
    "Airbus A340-600",
    "Airbus A340-400",
    "Boeing 747-400",
    "Embraer 190",
  ],
  SEPARATION_FEET: [
    "1,200 feet",
    "1,400 feet",
    "1,600 feet",
    "1,800 feet",
    "2,000 feet",
    "2,200 feet",
    "2,400 feet",
    "2,600 feet",
    "2,800 feet",
    "3,000 feet",
  ],
  MEAL_SERVICE_TIMES: [
    "90 minutes later",
    "two hours later",
    "two and a half hours later",
    "three hours later",
    "three and a half hours later",
    "four hours later",
    "four and a half hours later",
    "five hours later",
    "five and a half hours later",
    "six hours later",
  ],
  MEAL_OPTION_1: [
    "Chicken Teriyaki",
    "Thai Basil Chicken",
    "Grilled Salmon",
    "Chicken Curry",
    "Roast Duck Rice",
    "Lemon Chicken",
    "Chicken Katsu",
    "Herb Chicken Pasta",
    "Chicken Satay Rice",
    "Ginger Chicken Bowl",
  ],
  MEAL_OPTION_2: [
    "Beef Lasagna",
    "Braised Beef Rice",
    "Beef Stroganoff",
    "Beef Rendang",
    "Beef Bulgogi",
    "Beef Pot Pie",
    "Beef Noodle Bake",
    "Beef Bourguignon",
    "Beef Meatballs",
    "Beef Pasta Gratin",
  ],
  MEAL_OPTION_3: [
    "Vegetarian Pasta",
    "Vegetable Fried Rice",
    "Mushroom Risotto",
    "Spinach Ravioli",
    "Vegetarian Curry",
    "Pumpkin Gnocchi",
    "Eggplant Lasagna",
    "Tofu Rice Bowl",
    "Vegetable Couscous",
    "Lentil Pasta",
  ],
  MEAL_COUNT_1: PASSENGER_COUNTS,
  MEAL_COUNT_2: PASSENGER_COUNTS,
  MEAL_COUNT_3: PASSENGER_COUNTS,
  PASSENGER_AGES: ["34", "41", "49", "56", "61", "64", "68", "72", "75", "79"],
  PASSENGER_NATIONALITIES: [
    "German",
    "French",
    "Thai",
    "Australian",
    "Japanese",
    "British",
    "Swiss",
    "Dutch",
    "Italian",
    "Swedish",
  ],
  PASSENGER_SEATS: ["12A", "15C", "18F", "22D", "27B", "31A", "35K", "42A", "46D", "52H"],
  PASSENGER_SEATS_EXTENDED: ["18A", "37F", "43B", "12C", "21D", "24F", "29A", "33B", "41C", "48H"],
  DOCTOR_SEATS: ["3A", "7D", "11F", "15C", "19B", "24A", "28G", "33D", "37J", "44C"],
  DOCTOR_NATIONALITIES: [
    "French",
    "German",
    "Thai",
    "Singaporean",
    "Australian",
    "British",
    "Swiss",
    "Dutch",
    "Italian",
    "Norwegian",
  ],
  DOCTOR_GENDERS: ["male", "female"],
  DOCTOR_PROFESSIONS: [
    "physician",
    "cardiologist",
    "general practitioner",
    "emergency doctor",
    "surgeon",
    "internist",
    "anesthesiologist",
    "family doctor",
    "pulmonologist",
    "neurologist",
  ],
  GATES: ["A12", "A28", "B14", "B46", "C03", "C19", "D07", "D31", "E22", "F09"],
  FUEL_TONS: ["58", "61", "64", "68", "72", "75", "79", "80", "83", "87", "91"],
  TAKEOFF_WEIGHTS: ["198", "205", "214", "221", "231", "238", "244", "251", "259", "266", "357"],
  FIRST_CLASS_COUNTS: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
  BUSINESS_CLASS_COUNTS: ["24", "28", "31", "34", "38", "42", "46", "50", "54", "58"],
  ECONOMY_CLASS_COUNTS: ["182", "197", "214", "226", "243", "251", "268", "279", "291", "304"],
  FLIGHT_ATTENDANT_COUNTS: ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
  FORWARD_HOLD_CONTENTS: [
    "medical supplies",
    "priority baggage",
    "pharmaceutical cargo",
    "temperature-controlled freight",
    "fresh produce",
    "express parcels",
    "aircraft spares",
    "diplomatic mail",
    "sports equipment",
    "humanitarian aid",
  ],
  CENTER_HOLD_CONTENTS: [
    "mail and baggage",
    "standard baggage containers",
    "transfer luggage",
    "courier freight and baggage",
    "postal sacks and baggage",
    "bulk baggage",
    "mixed passenger luggage",
    "mail sacks and cargo tubs",
    "containerized baggage",
    "mail, baggage, and crew kits",
  ],
  AFT_HOLD_CONTENTS: [
    "electronics cargo",
    "high-value cargo",
    "consumer electronics",
    "computer equipment",
    "retail goods",
    "telecommunications equipment",
    "spare aircraft parts",
    "express electronics freight",
    "sealed cargo containers",
    "mixed commercial goods",
  ],
  OUTSIDE_AIR_TEMPERATURES: ["-48°C", "-50°C", "-52°C", "-54°C", "-56°C", "-58°C", "-60°C", "-62°C", "-64°C", "-66°C"],
  FLIGHT_ATTENDANT_AGES: ["29", "33", "37", "41", "46", "49", "52", "56", "59", "63"],
  VISIBILITY_DISTANCES: ["5 kilometers", "6 kilometers", "7 kilometers", "8 kilometers", "9 kilometers", "10 kilometers", "11 kilometers", "12 kilometers", "13 kilometers", "14 kilometers"],
  WIND_HEADINGS: ["210 degrees", "220 degrees", "230 degrees", "240 degrees", "250 degrees", "260 degrees", "270 degrees", "280 degrees", "290 degrees", "300 degrees"],
  WIND_SPEEDS: ["8 knots", "10 knots", "12 knots", "14 knots", "16 knots", "18 knots", "20 knots", "22 knots", "24 knots", "26 knots"],
  AIRPORT_CODES: ["MMZ", "BKU", "VIE", "LCA", "BKK", "FRA", "DOH", "DXB", "AMS", "ICN"],
  ATC_CENTERS: ["Tulsa ATC", "Prague ATC", "Warsaw ATC", "Vienna ATC", "Budapest ATC", "Sofia ATC", "Bucharest ATC", "Ankara ATC", "Riga ATC", "Belgrade ATC"],
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
  DEPARTURE_DATES: "the departure date",
  DEPARTURE_TIMES: "the departure time",
  AIRCRAFT_TYPES: "the aircraft type",
  FLIGHT_DURATIONS: "the flight duration",
  TOTAL_PASSENGERS: "the total passenger count",
  CABIN_CREW_COUNTS: "the cabin crew count",
  PILOT_COUNTS: "the pilot count",
  OVERFLIGHT_REGIONS: "the overflight region",
  OPPOSITE_TRAFFIC_TYPES: "the opposite traffic aircraft type",
  SEPARATION_FEET: "the reported separation",
  MEAL_SERVICE_TIMES: "when meal service began",
  MEAL_OPTION_1: "the first meal option",
  MEAL_OPTION_2: "the second meal option",
  MEAL_OPTION_3: "the third meal option",
  MEAL_COUNT_1: "the first meal count",
  MEAL_COUNT_2: "the second meal count",
  MEAL_COUNT_3: "the third meal count",
  PASSENGER_AGES: "the passenger age",
  PASSENGER_NATIONALITIES: "the passenger nationality",
  PASSENGER_SEATS: "the passenger seat",
  DOCTOR_SEATS: "the doctor seat",
  DOCTOR_NATIONALITIES: "the doctor nationality",
  DOCTOR_GENDERS: "the doctor gender",
  DOCTOR_PROFESSIONS: "the doctor profession",
  GATES: "the arrival gate",
  FUEL_TONS: "the fuel load",
  TAKEOFF_WEIGHTS: "the takeoff weight",
  FIRST_CLASS_COUNTS: "the first class passenger count",
  BUSINESS_CLASS_COUNTS: "the business class passenger count",
  ECONOMY_CLASS_COUNTS: "the economy passenger count",
  FLIGHT_ATTENDANT_COUNTS: "the flight attendant count",
  FORWARD_HOLD_CONTENTS: "the forward hold contents",
  CENTER_HOLD_CONTENTS: "the center hold contents",
  AFT_HOLD_CONTENTS: "the aft hold contents",
  OUTSIDE_AIR_TEMPERATURES: "the outside air temperature",
  FLIGHT_ATTENDANT_AGES: "the flight attendant age",
  VISIBILITY_DISTANCES: "the arrival visibility",
  WIND_HEADINGS: "the wind direction",
  WIND_SPEEDS: "the wind speed",
  ARRIVAL_TIMES: "the arrival time",
  AIRPORT_CODES: "the airport code",
  ATC_CENTERS: "the ATC center",
  PASSENGER_SEATS_EXTENDED: "the passenger seat",
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

function sampleDistinctFacts(keys: LibraryKey[]): Record<LibraryKey, string> {
  const usedValues = new Set<string>();
  const result = {} as Record<LibraryKey, string>;

  keys.forEach((key) => {
    const availableValues = SOURCE_LIBRARY[key].filter((value) => !usedValues.has(value));
    const value = sampleOne(availableValues.length > 0 ? availableValues : SOURCE_LIBRARY[key]);
    result[key] = value;
    usedValues.add(value);
  });

  return result;
}

function buildFlightRouteSegment(): PassageSegment {
  const routeFacts = sampleDistinctFacts([
    "INITIAL_CITIES",
    "DESTINATION_CITIES",
    "STOP_CITY_1",
    "STOP_CITY_2",
    "STOP_CITY_3",
  ]);

  const flight = {
    callsign: sampleFact("CALLSIGNS"),
    flightNumber: sampleFact("FLIGHT_NUMBERS"),
    flightLevel: sampleFact("FL_LEVELS"),
    initialCity: routeFacts.INITIAL_CITIES,
    destinationCity: routeFacts.DESTINATION_CITIES,
    firstStop: routeFacts.STOP_CITY_1,
    secondStop: routeFacts.STOP_CITY_2,
    thirdStop: routeFacts.STOP_CITY_3,
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

function buildIncidentFlightSegment(): PassageSegment {
  const routeFacts = sampleDistinctFacts([
    "INITIAL_CITIES",
    "DESTINATION_CITIES",
  ]);
  const mealCounts = sampleDistinctFacts(["MEAL_COUNT_1", "MEAL_COUNT_2", "MEAL_COUNT_3"]);

  const flight = {
    callsign: sampleFact("CALLSIGNS"),
    flightNumber: sampleFact("FLIGHT_NUMBERS"),
    departureCity: routeFacts.INITIAL_CITIES,
    destinationCity: routeFacts.DESTINATION_CITIES,
    departureDate: sampleFact("DEPARTURE_DATES"),
    departureTime: sampleFact("DEPARTURE_TIMES"),
    aircraftType: sampleFact("AIRCRAFT_TYPES"),
    flightDuration: sampleFact("FLIGHT_DURATIONS"),
    departureRunway: sampleFact("RUNWAYS"),
    initialHeading: sampleFact("HEADINGS"),
    totalPassengers: sampleFact("TOTAL_PASSENGERS"),
    cabinCrewCount: sampleFact("CABIN_CREW_COUNTS"),
    pilotCount: sampleFact("PILOT_COUNTS"),
    overflightRegion: sampleFact("OVERFLIGHT_REGIONS"),
    oppositeTrafficType: sampleFact("OPPOSITE_TRAFFIC_TYPES"),
    separationFeet: sampleFact("SEPARATION_FEET"),
    mealServiceTime: sampleFact("MEAL_SERVICE_TIMES"),
    mealOptionOne: sampleFact("MEAL_OPTION_1"),
    mealOptionTwo: sampleFact("MEAL_OPTION_2"),
    mealOptionThree: sampleFact("MEAL_OPTION_3"),
    mealCountOne: mealCounts.MEAL_COUNT_1,
    mealCountTwo: mealCounts.MEAL_COUNT_2,
    mealCountThree: mealCounts.MEAL_COUNT_3,
    passengerAge: sampleFact("PASSENGER_AGES"),
    passengerNationality: sampleFact("PASSENGER_NATIONALITIES"),
    passengerSeat: sampleFact("PASSENGER_SEATS"),
    doctorSeat: sampleFact("DOCTOR_SEATS"),
    doctorNationality: sampleFact("DOCTOR_NATIONALITIES"),
    doctorGender: sampleFact("DOCTOR_GENDERS"),
    doctorProfession: sampleFact("DOCTOR_PROFESSIONS"),
    arrivalTime: sampleFact("ARRIVAL_TIMES"),
    landingRunway: sampleFact("RUNWAYS"),
    gate: sampleFact("GATES"),
  };

  const text = [
    `Flight ${flight.callsign}${flight.flightNumber} departs from ${flight.departureCity} to ${flight.destinationCity} on ${flight.departureDate} at ${flight.departureTime} aboard an ${flight.aircraftType}.`,
    `Flight time is ${flight.flightDuration}, and the aircraft departs from runway ${flight.departureRunway} with initial heading ${flight.initialHeading} degrees.`,
    `There are ${flight.totalPassengers} passengers, ${flight.cabinCrewCount} cabin crew, and ${flight.pilotCount} pilots onboard.`,
    `While crossing ${flight.overflightRegion}, ATC instructs the aircraft to maintain altitude due to opposite traffic. A ${flight.oppositeTrafficType} is reported approaching in the opposite direction with ${flight.separationFeet} separation.`,
    `${flight.mealServiceTime.charAt(0).toUpperCase()}${flight.mealServiceTime.slice(1)} meal service begins. Three meal choices are offered: ${flight.mealOptionOne} for ${flight.mealCountOne} passengers, ${flight.mealOptionTwo} for ${flight.mealCountTwo} passengers, and ${flight.mealOptionThree} for ${flight.mealCountThree} passengers.`,
    `During cruise, a ${flight.passengerAge}-year-old ${flight.passengerNationality} passenger in seat ${flight.passengerSeat} feels chest discomfort. A ${flight.doctorNationality} ${flight.doctorGender} ${flight.doctorProfession} seated in ${flight.doctorSeat} comes forward to assist. Cabin crew provide oxygen and the passenger later feels better.`,
    `The aircraft lands in ${flight.destinationCity} at ${flight.arrivalTime} local time on runway ${flight.landingRunway} and parks at Gate ${flight.gate}.`,
  ].join(" ");

  const facts: RecallFact[] = [
    { key: "CALLSIGNS", value: flight.callsign, prompt: "In the incident flight template, what was the callsign?" },
    { key: "FLIGHT_NUMBERS", value: flight.flightNumber, prompt: "In the incident flight template, what was the flight number?" },
    { key: "INITIAL_CITIES", value: flight.departureCity, prompt: "What was the departure city?" },
    { key: "DESTINATION_CITIES", value: flight.destinationCity, prompt: "What was the destination city?" },
    { key: "DEPARTURE_DATES", value: flight.departureDate, prompt: "What was the departure date?" },
    { key: "DEPARTURE_TIMES", value: flight.departureTime, prompt: "What was the departure time?" },
    { key: "AIRCRAFT_TYPES", value: flight.aircraftType, prompt: "What aircraft type was used?" },
    { key: "FLIGHT_DURATIONS", value: flight.flightDuration, prompt: "What was the flight time?" },
    { key: "RUNWAYS", value: flight.departureRunway, prompt: "What runway was used for departure?", placeholder: "DEPARTURE_RUNWAY" },
    { key: "HEADINGS", value: flight.initialHeading, prompt: "What was the initial heading?" },
    { key: "TOTAL_PASSENGERS", value: flight.totalPassengers, prompt: "How many passengers were onboard?" },
    { key: "CABIN_CREW_COUNTS", value: flight.cabinCrewCount, prompt: "How many cabin crew were onboard?" },
    { key: "PILOT_COUNTS", value: flight.pilotCount, prompt: "How many pilots were onboard?" },
    { key: "OVERFLIGHT_REGIONS", value: flight.overflightRegion, prompt: "Which region was the aircraft crossing during the traffic advisory?" },
    { key: "OPPOSITE_TRAFFIC_TYPES", value: flight.oppositeTrafficType, prompt: "What opposite traffic aircraft type was reported?" },
    { key: "SEPARATION_FEET", value: flight.separationFeet, prompt: "What separation was reported between the aircraft?" },
    { key: "MEAL_SERVICE_TIMES", value: flight.mealServiceTime, prompt: "When did meal service begin?" },
    { key: "MEAL_OPTION_1", value: flight.mealOptionOne, prompt: "What was the first meal option?" },
    { key: "MEAL_OPTION_2", value: flight.mealOptionTwo, prompt: "What was the second meal option?" },
    { key: "MEAL_OPTION_3", value: flight.mealOptionThree, prompt: "What was the third meal option?" },
    { key: "MEAL_COUNT_1", value: flight.mealCountOne, prompt: `How many passengers chose ${flight.mealOptionOne}?` },
    { key: "MEAL_COUNT_2", value: flight.mealCountTwo, prompt: `How many passengers chose ${flight.mealOptionTwo}?` },
    { key: "MEAL_COUNT_3", value: flight.mealCountThree, prompt: `How many passengers chose ${flight.mealOptionThree}?` },
    { key: "PASSENGER_AGES", value: flight.passengerAge, prompt: "How old was the passenger with chest discomfort?" },
    { key: "PASSENGER_NATIONALITIES", value: flight.passengerNationality, prompt: "What was the passenger's nationality?" },
    { key: "PASSENGER_SEATS", value: flight.passengerSeat, prompt: "What was the affected passenger's seat?" },
    { key: "DOCTOR_SEATS", value: flight.doctorSeat, prompt: "What seat was the doctor sitting in?" },
    { key: "DOCTOR_NATIONALITIES", value: flight.doctorNationality, prompt: "What was the doctor's nationality?" },
    { key: "DOCTOR_GENDERS", value: flight.doctorGender, prompt: "What was the doctor's gender?" },
    { key: "DOCTOR_PROFESSIONS", value: flight.doctorProfession, prompt: "What was the doctor's profession?" },
    { key: "DEPARTURE_TIMES", value: flight.arrivalTime, prompt: "What was the local arrival time?", placeholder: "ARRIVAL_TIME_LOCAL" },
    { key: "RUNWAYS", value: flight.landingRunway, prompt: "What runway was used for landing?", placeholder: "LANDING_RUNWAY" },
    { key: "GATES", value: flight.gate, prompt: "What gate did the aircraft park at?" },
  ];

  return {
    id: "incident-flight-template",
    text,
    questions: facts.map(buildRecallQuestion),
  };
}

function buildOperationalFlightSegment(): PassageSegment {
  const routeFacts = sampleDistinctFacts([
    "INITIAL_CITIES",
    "DESTINATION_CITIES",
  ]);
  const mealCounts = sampleDistinctFacts(["MEAL_COUNT_1", "MEAL_COUNT_2", "MEAL_COUNT_3"]);

  const flight = {
    callsign: sampleFact("CALLSIGNS"),
    flightNumber: sampleFact("FLIGHT_NUMBERS"),
    departureCity: routeFacts.INITIAL_CITIES,
    destinationCity: routeFacts.DESTINATION_CITIES,
    aircraftType: sampleFact("AIRCRAFT_TYPES"),
    departureTime: sampleFact("DEPARTURE_TIMES"),
    departureRunway: sampleFact("RUNWAYS"),
    initialHeading: sampleFact("HEADINGS"),
    fuelTons: sampleFact("FUEL_TONS"),
    takeoffWeight: sampleFact("TAKEOFF_WEIGHTS"),
    totalPassengers: sampleFact("TOTAL_PASSENGERS"),
    firstClassCount: sampleFact("FIRST_CLASS_COUNTS"),
    businessClassCount: sampleFact("BUSINESS_CLASS_COUNTS"),
    economyClassCount: sampleFact("ECONOMY_CLASS_COUNTS"),
    flightAttendantCount: sampleFact("FLIGHT_ATTENDANT_COUNTS"),
    pilotCount: sampleFact("PILOT_COUNTS"),
    forwardHoldContents: sampleFact("FORWARD_HOLD_CONTENTS"),
    centerHoldContents: sampleFact("CENTER_HOLD_CONTENTS"),
    aftHoldContents: sampleFact("AFT_HOLD_CONTENTS"),
    cruiseLevel: sampleFact("FL_LEVELS"),
    outsideAirTemperature: sampleFact("OUTSIDE_AIR_TEMPERATURES"),
    anxiousPassengerNationality: sampleFact("PASSENGER_NATIONALITIES"),
    anxiousPassengerSeat: sampleFact("PASSENGER_SEATS"),
    flightAttendantAge: sampleFact("FLIGHT_ATTENDANT_AGES"),
    breakfastOptionOne: sampleFact("MEAL_OPTION_1"),
    breakfastOptionTwo: sampleFact("MEAL_OPTION_2"),
    breakfastOptionThree: sampleFact("MEAL_OPTION_3"),
    breakfastCountOne: mealCounts.MEAL_COUNT_1,
    breakfastCountTwo: mealCounts.MEAL_COUNT_2,
    breakfastCountThree: mealCounts.MEAL_COUNT_3,
    secondPassengerAge: sampleFact("PASSENGER_AGES"),
    secondPassengerNationality: sampleFact("PASSENGER_NATIONALITIES"),
    secondPassengerSeat: sampleFact("PASSENGER_SEATS"),
    doctorNationality: sampleFact("DOCTOR_NATIONALITIES"),
    doctorSeat: sampleFact("DOCTOR_SEATS"),
    oppositeTrafficType: sampleFact("OPPOSITE_TRAFFIC_TYPES"),
    separationFeet: sampleFact("SEPARATION_FEET"),
    arrivalTime: sampleFact("ARRIVAL_TIMES"),
    landingRunway: sampleFact("RUNWAYS"),
    gate: sampleFact("GATES"),
    visibilityDistance: sampleFact("VISIBILITY_DISTANCES"),
    windHeading: sampleFact("WIND_HEADINGS"),
    windSpeed: sampleFact("WIND_SPEEDS"),
  };

  const text = [
    `Flight ${flight.callsign}${flight.flightNumber} is operating from ${flight.departureCity} to ${flight.destinationCity} on an ${flight.aircraftType}. Departure time is ${flight.departureTime} from runway ${flight.departureRunway}, initially heading ${flight.initialHeading} degrees.`,
    `The aircraft carries ${flight.fuelTons} tons of fuel with a takeoff weight of ${flight.takeoffWeight} tons.`,
    `There are ${flight.totalPassengers} passengers onboard, consisting of ${flight.firstClassCount} First Class passengers, ${flight.businessClassCount} Business Class passengers, and ${flight.economyClassCount} Economy passengers.`,
    `Crew complement includes ${flight.flightAttendantCount} flight attendants and ${flight.pilotCount} pilots.`,
    `The aircraft has three cargo compartments: the forward hold contains ${flight.forwardHoldContents}, the center hold contains ${flight.centerHoldContents}, and the aft hold contains ${flight.aftHoldContents}.`,
    `Cruising altitude is Flight Level ${flight.cruiseLevel.replace("FL", "")} and outside air temperature is ${flight.outsideAirTemperature}.`,
    `Shortly after departure, an elderly ${flight.anxiousPassengerNationality} passenger in seat ${flight.anxiousPassengerSeat} becomes anxious due to fear of flying. He calls a ${flight.flightAttendantAge}-year-old male flight attendant, who walks with him through the cabin, explains aircraft systems, and later escorts him to the cockpit to speak briefly with the captain. The passenger becomes calm afterward.`,
    `Three hours into the flight, breakfast service begins with three choices: ${flight.breakfastOptionOne} for ${flight.breakfastCountOne} passengers, ${flight.breakfastOptionTwo} for ${flight.breakfastCountTwo} passengers, and ${flight.breakfastOptionThree} for ${flight.breakfastCountThree} passengers.`,
    `Later, a ${flight.secondPassengerAge}-year-old ${flight.secondPassengerNationality} passenger in seat ${flight.secondPassengerSeat} reports dizziness. A ${flight.doctorNationality} doctor seated in ${flight.doctorSeat} assists the crew and the passenger recovers.`,
    `During descent into ${flight.destinationCity}, Prague ATC instructs the flight to climb due to opposite traffic. A ${flight.oppositeTrafficType} is approaching in the opposite direction with approximately ${flight.separationFeet} separation.`,
    `After the traffic conflict is resolved, the aircraft lands safely at ${flight.arrivalTime} on runway ${flight.landingRunway} and parks at Gate ${flight.gate}. Arrival weather reports visibility ${flight.visibilityDistance} with winds ${flight.windHeading} at ${flight.windSpeed}.`,
  ].join(" ");

  const facts: RecallFact[] = [
    { key: "CALLSIGNS", value: flight.callsign, prompt: "In the operational flight template, what was the callsign?" },
    { key: "FLIGHT_NUMBERS", value: flight.flightNumber, prompt: "In the operational flight template, what was the flight number?" },
    { key: "INITIAL_CITIES", value: flight.departureCity, prompt: "What was the departure city?" },
    { key: "DESTINATION_CITIES", value: flight.destinationCity, prompt: "What was the destination city?" },
    { key: "AIRCRAFT_TYPES", value: flight.aircraftType, prompt: "What aircraft type was operating the flight?" },
    { key: "DEPARTURE_TIMES", value: flight.departureTime, prompt: "What was the departure time?", placeholder: "OPS_DEPARTURE_TIME" },
    { key: "RUNWAYS", value: flight.departureRunway, prompt: "What runway was used for departure?", placeholder: "OPS_DEPARTURE_RUNWAY" },
    { key: "HEADINGS", value: flight.initialHeading, prompt: "What was the initial heading?" },
    { key: "FUEL_TONS", value: flight.fuelTons, prompt: "How many tons of fuel were onboard?" },
    { key: "TAKEOFF_WEIGHTS", value: flight.takeoffWeight, prompt: "What was the takeoff weight?" },
    { key: "TOTAL_PASSENGERS", value: flight.totalPassengers, prompt: "How many passengers were onboard?" },
    { key: "FIRST_CLASS_COUNTS", value: flight.firstClassCount, prompt: "How many First Class passengers were onboard?" },
    { key: "BUSINESS_CLASS_COUNTS", value: flight.businessClassCount, prompt: "How many Business Class passengers were onboard?" },
    { key: "ECONOMY_CLASS_COUNTS", value: flight.economyClassCount, prompt: "How many Economy passengers were onboard?" },
    { key: "FLIGHT_ATTENDANT_COUNTS", value: flight.flightAttendantCount, prompt: "How many flight attendants were onboard?" },
    { key: "PILOT_COUNTS", value: flight.pilotCount, prompt: "How many pilots were onboard?" },
    { key: "FORWARD_HOLD_CONTENTS", value: flight.forwardHoldContents, prompt: "What was stored in the forward hold?" },
    { key: "CENTER_HOLD_CONTENTS", value: flight.centerHoldContents, prompt: "What was stored in the center hold?" },
    { key: "AFT_HOLD_CONTENTS", value: flight.aftHoldContents, prompt: "What was stored in the aft hold?" },
    { key: "FL_LEVELS", value: flight.cruiseLevel, prompt: "What was the cruising altitude?" },
    { key: "OUTSIDE_AIR_TEMPERATURES", value: flight.outsideAirTemperature, prompt: "What was the outside air temperature?" },
    { key: "PASSENGER_NATIONALITIES", value: flight.anxiousPassengerNationality, prompt: "What was the nationality of the anxious passenger?", placeholder: "ANXIOUS_PASSENGER_NATIONALITY" },
    { key: "PASSENGER_SEATS", value: flight.anxiousPassengerSeat, prompt: "What seat was the anxious passenger in?", placeholder: "ANXIOUS_PASSENGER_SEAT" },
    { key: "FLIGHT_ATTENDANT_AGES", value: flight.flightAttendantAge, prompt: "How old was the flight attendant who helped the anxious passenger?" },
    { key: "MEAL_OPTION_1", value: flight.breakfastOptionOne, prompt: "What was the first breakfast option?" },
    { key: "MEAL_OPTION_2", value: flight.breakfastOptionTwo, prompt: "What was the second breakfast option?" },
    { key: "MEAL_OPTION_3", value: flight.breakfastOptionThree, prompt: "What was the third breakfast option?" },
    { key: "MEAL_COUNT_1", value: flight.breakfastCountOne, prompt: `How many passengers chose ${flight.breakfastOptionOne}?`, placeholder: "BREAKFAST_COUNT_1" },
    { key: "MEAL_COUNT_2", value: flight.breakfastCountTwo, prompt: `How many passengers chose ${flight.breakfastOptionTwo}?`, placeholder: "BREAKFAST_COUNT_2" },
    { key: "MEAL_COUNT_3", value: flight.breakfastCountThree, prompt: `How many passengers chose ${flight.breakfastOptionThree}?`, placeholder: "BREAKFAST_COUNT_3" },
    { key: "PASSENGER_AGES", value: flight.secondPassengerAge, prompt: "How old was the passenger who later reported dizziness?" },
    { key: "PASSENGER_NATIONALITIES", value: flight.secondPassengerNationality, prompt: "What was the nationality of the passenger who reported dizziness?", placeholder: "DIZZY_PASSENGER_NATIONALITY" },
    { key: "PASSENGER_SEATS", value: flight.secondPassengerSeat, prompt: "What seat was the passenger in who reported dizziness?", placeholder: "DIZZY_PASSENGER_SEAT" },
    { key: "DOCTOR_NATIONALITIES", value: flight.doctorNationality, prompt: "What was the doctor's nationality?" },
    { key: "DOCTOR_SEATS", value: flight.doctorSeat, prompt: "What seat was the doctor in?" },
    { key: "OPPOSITE_TRAFFIC_TYPES", value: flight.oppositeTrafficType, prompt: "What opposite traffic aircraft type was reported during descent?" },
    { key: "SEPARATION_FEET", value: flight.separationFeet, prompt: "What separation was reported during the traffic conflict?" },
    { key: "DEPARTURE_TIMES", value: flight.arrivalTime, prompt: "What was the arrival time?", placeholder: "OPS_ARRIVAL_TIME" },
    { key: "RUNWAYS", value: flight.landingRunway, prompt: "What runway was used for landing?", placeholder: "OPS_LANDING_RUNWAY" },
    { key: "GATES", value: flight.gate, prompt: "What gate did the aircraft park at?" },
    { key: "VISIBILITY_DISTANCES", value: flight.visibilityDistance, prompt: "What arrival visibility was reported?" },
    { key: "WIND_HEADINGS", value: flight.windHeading, prompt: "What wind direction was reported on arrival?" },
    { key: "WIND_SPEEDS", value: flight.windSpeed, prompt: "What wind speed was reported on arrival?" },
  ];

  return {
    id: "operational-flight-template",
    text,
    questions: facts.map(buildRecallQuestion),
  };
}

function buildHeavyOperationsTemplate(): PassageSegment {
  const selectedDepartureCode = sampleFact("AIRPORT_CODES");
  let selectedDestinationCode = sampleFact("AIRPORT_CODES");
  while (selectedDestinationCode === selectedDepartureCode) {
    selectedDestinationCode = sampleFact("AIRPORT_CODES");
  }

  const flight = {
    callsign: sampleFact("CALLSIGNS"),
    flightNumber: sampleFact("FLIGHT_NUMBERS"),
    departureCode: selectedDepartureCode,
    destinationCode: selectedDestinationCode,
    aircraftType: sampleFact("AIRCRAFT_TYPES"),
    departureTime: sampleFact("DEPARTURE_TIMES"),
    departureRunway: sampleFact("RUNWAYS"),
    initialHeading: sampleFact("HEADINGS"),
    fuelTons: sampleFact("FUEL_TONS"),
    takeoffWeight: sampleFact("TAKEOFF_WEIGHTS"),
    totalPassengers: sampleFact("TOTAL_PASSENGERS"),
    businessClassCount: sampleFact("BUSINESS_CLASS_COUNTS"),
    economyClassCount: sampleFact("ECONOMY_CLASS_COUNTS"),
    flightAttendantCount: sampleFact("FLIGHT_ATTENDANT_COUNTS"),
    pilotCount: sampleFact("PILOT_COUNTS"),
    anxiousPassengerNationality: sampleFact("PASSENGER_NATIONALITIES"),
    anxiousPassengerSeat: sampleFact("PASSENGER_SEATS"),
    flightAttendantAge: sampleFact("FLIGHT_ATTENDANT_AGES"),
    atcCenter: sampleFact("ATC_CENTERS"),
    oppositeTrafficType: sampleFact("OPPOSITE_TRAFFIC_TYPES"),
    separationFeet: sampleFact("SEPARATION_FEET"),
    arrivalTime: sampleFact("ARRIVAL_TIMES"),
    landingRunway: sampleFact("RUNWAYS"),
  };

  const text = [
    `Flight ${flight.callsign}${flight.flightNumber} is operating from ${flight.departureCode} to ${flight.destinationCode} on a ${flight.aircraftType}. Departure time is ${flight.departureTime} from runway ${flight.departureRunway}, initially heading ${flight.initialHeading} degrees.`,
    `The aircraft carries ${flight.fuelTons} tons of fuel with a takeoff weight of ${flight.takeoffWeight} tons.`,
    `There are ${flight.totalPassengers} passengers onboard, consisting of ${flight.businessClassCount} passengers in Business Class and ${flight.economyClassCount} passengers in Economy Class.`,
    `Crew complement includes ${flight.flightAttendantCount} flight attendants and ${flight.pilotCount} pilots.`,
    `Shortly after departure, an elderly ${flight.anxiousPassengerNationality} passenger in seat ${flight.anxiousPassengerSeat} becomes anxious due to fear of flying. He calls a ${flight.flightAttendantAge}-year-old male flight attendant, who walks with him through the cabin, explains aircraft operations, and later brings him to the cockpit to speak with the captain. The passenger becomes calm afterward.`,
    `During descent into ${flight.destinationCode}, ${flight.atcCenter} instructs Flight ${flight.callsign}${flight.flightNumber} to climb due to opposite traffic. An ${flight.oppositeTrafficType} is reported approaching in the opposite direction with approximately ${flight.separationFeet} separation.`,
    `After the traffic conflict is resolved, the aircraft continues approach and lands safely at ${flight.arrivalTime} on runway ${flight.landingRunway}.`,
  ].join(" ");

  const facts: RecallFact[] = [
    { key: "CALLSIGNS", value: flight.callsign, prompt: "In the heavy operations template, what was the callsign?" },
    { key: "FLIGHT_NUMBERS", value: flight.flightNumber, prompt: "In the heavy operations template, what was the flight number?" },
    { key: "AIRPORT_CODES", value: flight.departureCode, prompt: "What was the departure airport code?", placeholder: "HEAVY_DEPARTURE_CODE" },
    { key: "AIRPORT_CODES", value: flight.destinationCode, prompt: "What was the destination airport code?", placeholder: "HEAVY_DESTINATION_CODE" },
    { key: "AIRCRAFT_TYPES", value: flight.aircraftType, prompt: "What aircraft type was used?" },
    { key: "DEPARTURE_TIMES", value: flight.departureTime, prompt: "What was the departure time?", placeholder: "HEAVY_DEPARTURE_TIME" },
    { key: "RUNWAYS", value: flight.departureRunway, prompt: "What runway was used for departure?", placeholder: "HEAVY_DEPARTURE_RUNWAY" },
    { key: "HEADINGS", value: flight.initialHeading, prompt: "What was the initial heading?" },
    { key: "FUEL_TONS", value: flight.fuelTons, prompt: "How many tons of fuel were onboard?" },
    { key: "TAKEOFF_WEIGHTS", value: flight.takeoffWeight, prompt: "What was the takeoff weight?" },
    { key: "TOTAL_PASSENGERS", value: flight.totalPassengers, prompt: "How many passengers were onboard?" },
    { key: "BUSINESS_CLASS_COUNTS", value: flight.businessClassCount, prompt: "How many Business Class passengers were onboard?" },
    { key: "ECONOMY_CLASS_COUNTS", value: flight.economyClassCount, prompt: "How many Economy Class passengers were onboard?" },
    { key: "FLIGHT_ATTENDANT_COUNTS", value: flight.flightAttendantCount, prompt: "How many flight attendants were onboard?" },
    { key: "PILOT_COUNTS", value: flight.pilotCount, prompt: "How many pilots were onboard?" },
    { key: "PASSENGER_NATIONALITIES", value: flight.anxiousPassengerNationality, prompt: "What was the nationality of the anxious passenger?" },
    { key: "PASSENGER_SEATS", value: flight.anxiousPassengerSeat, prompt: "What seat was the anxious passenger in?" },
    { key: "FLIGHT_ATTENDANT_AGES", value: flight.flightAttendantAge, prompt: "How old was the flight attendant who helped the anxious passenger?" },
    { key: "ATC_CENTERS", value: flight.atcCenter, prompt: "Which ATC center issued the climb instruction?" },
    { key: "OPPOSITE_TRAFFIC_TYPES", value: flight.oppositeTrafficType, prompt: "What opposite traffic aircraft type was reported?" },
    { key: "SEPARATION_FEET", value: flight.separationFeet, prompt: "What separation was reported during the traffic conflict?" },
    { key: "ARRIVAL_TIMES", value: flight.arrivalTime, prompt: "What was the landing time?" },
    { key: "RUNWAYS", value: flight.landingRunway, prompt: "What runway was used for landing?", placeholder: "HEAVY_LANDING_RUNWAY" },
  ];

  return {
    id: "heavy-operations-template",
    text,
    questions: facts.map(buildRecallQuestion),
  };
}

function buildCodeRouteConflictTemplate(): PassageSegment {
  const flight = {
    callsign: "U",
    flightNumber: "236",
    departureCode: "MMZ",
    destinationCode: "BKU",
    aircraftType: "Boeing 747-400",
    departureTime: "2:40 a.m.",
    departureRunway: "01L",
    initialHeading: "273",
    fuelTons: "80",
    takeoffWeight: "357",
    totalPassengers: "339",
    businessClassCount: "28",
    economyClassCount: "311",
    flightAttendantCount: "18",
    pilotCount: "4",
    anxiousPassengerNationality: "German",
    anxiousPassengerSeat: "43B",
    flightAttendantAge: "49",
    atcCenter: "Tulsa ATC",
    oppositeTrafficType: "Airbus A340-400",
    separationFeet: "1,500 feet",
    arrivalTime: "6:41 p.m.",
    landingRunway: sampleFact("RUNWAYS"),
  };

  const text = [
    `Flight ${flight.callsign}${flight.flightNumber} is operating from ${flight.departureCode} to ${flight.destinationCode} on a ${flight.aircraftType}. Departure time is ${flight.departureTime} from runway ${flight.departureRunway}, initially heading ${flight.initialHeading} degrees.`,
    `The aircraft carries ${flight.fuelTons} tons of fuel with a takeoff weight of ${flight.takeoffWeight} tons. There are ${flight.totalPassengers} passengers onboard, consisting of ${flight.businessClassCount} passengers in Business Class and ${flight.economyClassCount} passengers in Economy Class.`,
    `Crew complement includes ${flight.flightAttendantCount} flight attendants and ${flight.pilotCount} pilots.`,
    `Shortly after departure, an elderly ${flight.anxiousPassengerNationality} passenger in seat ${flight.anxiousPassengerSeat} becomes anxious due to fear of flying. He calls a ${flight.flightAttendantAge}-year-old male flight attendant, who walks with him through the cabin, explains aircraft operations, and later brings him to the cockpit to speak with the captain. The passenger becomes calm afterward.`,
    `During descent into ${flight.destinationCode}, ${flight.atcCenter} instructs Flight ${flight.callsign}${flight.flightNumber} to climb due to opposite traffic. An ${flight.oppositeTrafficType} is reported approaching in the opposite direction with approximately ${flight.separationFeet} separation.`,
    `After the traffic conflict is resolved, the aircraft continues approach and lands safely at ${flight.arrivalTime} on runway ${flight.landingRunway}.`,
  ].join(" ");

  const facts: RecallFact[] = [
    { key: "CALLSIGNS", value: flight.callsign, prompt: "In the coded route template, what was the callsign?" },
    { key: "FLIGHT_NUMBERS", value: flight.flightNumber, prompt: "In the coded route template, what was the flight number?" },
    { key: "AIRPORT_CODES", value: flight.departureCode, prompt: "What was the departure airport code?", placeholder: "CODE_ROUTE_DEPARTURE" },
    { key: "AIRPORT_CODES", value: flight.destinationCode, prompt: "What was the destination airport code?", placeholder: "CODE_ROUTE_DESTINATION" },
    { key: "AIRCRAFT_TYPES", value: flight.aircraftType, prompt: "What aircraft type was used?" },
    { key: "DEPARTURE_TIMES", value: flight.departureTime, prompt: "What was the departure time?" },
    { key: "RUNWAYS", value: flight.departureRunway, prompt: "What runway was used for departure?", placeholder: "CODE_ROUTE_DEPARTURE_RUNWAY" },
    { key: "HEADINGS", value: flight.initialHeading, prompt: "What was the initial heading?" },
    { key: "FUEL_TONS", value: flight.fuelTons, prompt: "How many tons of fuel were onboard?" },
    { key: "TAKEOFF_WEIGHTS", value: flight.takeoffWeight, prompt: "What was the takeoff weight?" },
    { key: "TOTAL_PASSENGERS", value: flight.totalPassengers, prompt: "How many passengers were onboard?" },
    { key: "BUSINESS_CLASS_COUNTS", value: flight.businessClassCount, prompt: "How many Business Class passengers were onboard?" },
    { key: "ECONOMY_CLASS_COUNTS", value: flight.economyClassCount, prompt: "How many Economy Class passengers were onboard?" },
    { key: "FLIGHT_ATTENDANT_COUNTS", value: flight.flightAttendantCount, prompt: "How many flight attendants were onboard?" },
    { key: "PILOT_COUNTS", value: flight.pilotCount, prompt: "How many pilots were onboard?" },
    { key: "PASSENGER_NATIONALITIES", value: flight.anxiousPassengerNationality, prompt: "What was the nationality of the anxious passenger?" },
    { key: "PASSENGER_SEATS_EXTENDED", value: flight.anxiousPassengerSeat, prompt: "What seat was the anxious passenger in?" },
    { key: "FLIGHT_ATTENDANT_AGES", value: flight.flightAttendantAge, prompt: "How old was the flight attendant who helped the anxious passenger?" },
    { key: "ATC_CENTERS", value: flight.atcCenter, prompt: "Which ATC center issued the climb instruction?" },
    { key: "OPPOSITE_TRAFFIC_TYPES", value: flight.oppositeTrafficType, prompt: "What opposite traffic aircraft type was reported?" },
    { key: "SEPARATION_FEET", value: flight.separationFeet, prompt: "What separation was reported during the traffic conflict?" },
    { key: "ARRIVAL_TIMES", value: flight.arrivalTime, prompt: "What was the landing time?" },
    { key: "RUNWAYS", value: flight.landingRunway, prompt: "What runway was used for landing?", placeholder: "CODE_ROUTE_LANDING_RUNWAY" },
  ];

  return {
    id: "coded-route-conflict-template",
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

export function generatePassageRecallQuiz({
  mode = "real",
  readingDurationSeconds = READING_DURATION_SECONDS,
}: {
  mode?: "learn" | "real";
  readingDurationSeconds?: number;
} = {}): PassageRecallQuizResponse {
  const templateBuilders = [
    () => buildFlightRouteSegment(),
    () => buildIncidentFlightSegment(),
    () => buildOperationalFlightSegment(),
    () => buildHeavyOperationsTemplate(),
    () => buildCodeRouteConflictTemplate(),
    () => {
      const selectedAtcSegments = shuffleArray(PASSAGE_TEMPLATES)
        .slice(0, 3)
        .map(buildTemplateSegment);

      return {
        id: "atc-composite-template",
        text: joinPassageSegments(selectedAtcSegments),
        questions: selectedAtcSegments.flatMap((segment) => segment.questions),
      } satisfies PassageSegment;
    },
  ];
  const selectedTemplate = sampleOne(templateBuilders)();

  return {
    id: generateId("session"),
    templateId: selectedTemplate.id,
    mode,
    passage: selectedTemplate.text,
    questions: selectedTemplate.questions,
    readingDurationSeconds,
    mathQuestions: Array.from({ length: 3 }, (_, index) => generateMathQuestion(index)),
  };
}
