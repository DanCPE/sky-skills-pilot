import type { Topic } from "@/types";

export const topics: Topic[] = [
  {
    slug: "box-folding",
    icon: "📦",
    title: "Box Folding",
    description: "Visualize how 2D nets fold into 3D shapes.",
  },
  {
    slug: "number-series",
    icon: "🔢",
    title: "Number Series",
    description: "Find the pattern in numerical sequences.",
  },
  {
    slug: "calculate",
    icon: "🧮",
    title: "Calculate",
    description: "Practice arithmetic and mental math.",
  },
  {
    slug: "pattern-recognition",
    icon: "🔍",
    title: "Pattern Recognition",
    description: "Identify rules and predict what comes next.",
  },
  {
    slug: "spatial-reasoning",
    icon: "🧩",
    title: "Spatial Reasoning",
    description: "Solve puzzles involving shapes and space.",
  },
];

export const topicSlugs = new Set(topics.map((t) => t.slug));
