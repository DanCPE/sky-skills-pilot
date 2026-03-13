import type { Topic } from "@/types";

export const topics: Topic[] = [
  {
    slug: "box-folding",
    icon: "📦",
    title: "Box Folding",
    description: "Visualize how 2D nets fold into 3D shapes.",
    category: "spatial",
    isLocked: true,
  },
  {
    slug: "number-series",
    icon: "🔢",
    title: "Number Series",
    description: "Find the pattern in numerical sequences.",
    category: "logical",
    isLocked: false,
  },
  {
    slug: "calculate",
    icon: "🧮",
    title: "Calculate",
    description: "Practice arithmetic and mental math.",
    category: "approximation",
    isLocked: true,
  },
  {
    slug: "pattern-recognition",
    icon: "🔍",
    title: "Pattern Recognition",
    description: "Identify rules and predict what comes next.",
    category: "logical",
    isLocked: true,
  },
  {
    slug: "spatial-reasoning",
    icon: "🧩",
    title: "Spatial Reasoning",
    description: "Solve puzzles involving shapes and space.",
    category: "spatial",
    isLocked: true,
  },
  {
    slug: "spatial-orientation",
    icon: "✈️",
    title: "Spatial Orientation",
    description: "Calculate aircraft heading changes and visualize rotations.",
    category: "spatial",
    isLocked: false,
  },
  {
    slug: "string-comparison",
    icon: "👁️",
    title: "String Comparison",
    description: "Quickly compare alphanumeric strings and identify differences.",
    category: "scanning",
    isLocked: false,
  },
];

export const topicSlugs = new Set(topics.map((t) => t.slug));
