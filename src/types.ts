export type QuestionCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: string;
  sortOrder: number;
  talkModes: string[];
};

export type DeepQuestion = {
  id: string;
  categoryId: string;
  categorySlug: string;
  question: string;
  helperText: string;
  level: number;
  tags: string[];
  audience: string[];
  sensitivity: string[];
  requiresConsent: boolean;
  defaultPool: boolean;
  contentNote: string;
  aftercareLevel: number;
  talkModes: string[];
};

export type QuestionDeck = {
  categories: QuestionCategory[];
  questions: DeepQuestion[];
  source: "supabase" | "fallback";
};
