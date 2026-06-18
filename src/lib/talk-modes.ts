import type { DeepQuestion } from "@/types";

export const talkModes = [
  {
    id: "deep",
    label: "โหมดอบอุ่นใจ",
    shortLabel: "Deep Talk",
  },
  {
    id: "interesting",
    label: "โหมดคุยเปิดโลก",
    shortLabel: "Interesting Talk",
  },
] as const;

export type TalkModeId = (typeof talkModes)[number]["id"];

export const defaultTalkModeId: TalkModeId = "deep";

export function parseTalkModeId(value: string | null): TalkModeId {
  return talkModes.some((mode) => mode.id === value)
    ? (value as TalkModeId)
    : defaultTalkModeId;
}

export function questionMatchesTalkMode(question: DeepQuestion, mode: TalkModeId) {
  if (question.talkModes && question.talkModes.length > 0) {
    return question.talkModes.includes(mode);
  }

  return mode === "deep";
}

export function filterQuestionsByTalkMode(
  questions: DeepQuestion[],
  mode: TalkModeId,
) {
  return questions.filter((question) => questionMatchesTalkMode(question, mode));
}

