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
    coverImage: "/images/icons/SkyQuests/number.png",
    coverImageDark: "/images/icons/SkyQuests/number dark.png",
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
    title: "Aircraft Rotation",
    description: "Calculate aircraft heading changes and visualize rotations.",
    category: "spatial",
    isLocked: false,
    coverImage: "/images/icons/SkyQuests/aircraft rota.png",
    coverImageDark: "/images/icons/SkyQuests/aircaft rota dark.png",
  },
  {
    slug: "string-comparison",
    icon: "👁️",
    title: "String Comparison",
    description: "Quickly compare alphanumeric strings and identify differences.",
    category: "scanning",
    isLocked: false,
    coverImage: "/images/icons/SkyQuests/string.png",
    coverImageDark: "/images/icons/SkyQuests/string dark.png",
  },
];

export const topicSlugs = new Set(topics.map((t) => t.slug));
