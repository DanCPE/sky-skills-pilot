import { topics } from "@/lib/topics";
import type { TopicCategory } from "@/types";

export type AccountSkillDomainSlug =
  | "logical-reasoning"
  | "spatial-orientation"
  | "visual-scanning"
  | "numerical-agility"
  | "short-term-memory"
  | "multitasking";

export interface AccountSkillDomain {
  slug: AccountSkillDomainSlug;
  label: string;
  description: string;
}

export const accountSkillDomains: AccountSkillDomain[] = [
  {
    slug: "logical-reasoning",
    label: "Logical Reasoning",
    description: "Pattern finding, sequencing, and rule recognition.",
  },
  {
    slug: "spatial-orientation",
    label: "Spatial Orientation",
    description: "Rotation, direction, and 3D visualization.",
  },
  {
    slug: "visual-scanning",
    label: "Visual Scanning",
    description: "Fast visual search and comparison accuracy.",
  },
  {
    slug: "numerical-agility",
    label: "Numerical Agility",
    description: "Mental math, estimation, and operator fluency.",
  },
  {
    slug: "short-term-memory",
    label: "Short-Term Memory",
    description: "Holding and reconstructing information under pressure.",
  },
  {
    slug: "multitasking",
    label: "Multitasking",
    description: "Coordinating timing, audio, calculations, and responses under pressure.",
  },
];

const categoryDomainMap: Record<TopicCategory, AccountSkillDomainSlug> = {
  logical: "logical-reasoning",
  spatial: "spatial-orientation",
  scanning: "visual-scanning",
  approximation: "numerical-agility",
  "short-term-memory": "short-term-memory",
  multitasking: "multitasking",
};

const topicDomainOverrides: Record<string, AccountSkillDomainSlug> = {
  "dern-jood": "multitasking",
};

export function getAccountSkillDomainForTopic(
  topicSlug: string,
): AccountSkillDomainSlug {
  const override = topicDomainOverrides[topicSlug];
  if (override) return override;

  const topic = topics.find((candidate) => candidate.slug === topicSlug);
  if (!topic) return "logical-reasoning";

  return categoryDomainMap[topic.category];
}
