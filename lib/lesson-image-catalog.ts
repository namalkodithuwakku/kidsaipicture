import { SENTENCE_LESSONS } from "@/lib/sentence-library";
import { CONVERSATION_LESSONS } from "@/lib/conversation-library";
import { EVERYDAY_LESSONS } from "@/lib/everyday-english-library";

export type LessonImagePage = "sentences" | "conversations" | "everyday";

export type LessonImageItem = {
  id: string;
  page: LessonImagePage;
  title: string;
  prompt: string;
};

export function getLessonImageItems(page: LessonImagePage): LessonImageItem[] {
  if (page === "sentences") {
    return SENTENCE_LESSONS.map((lesson) => ({
      id: lesson.id,
      page,
      title: lesson.sentence,
      prompt: `A clear learning scene illustrating the sentence: "${lesson.sentence}" Context: ${lesson.hint}`,
    }));
  }

  if (page === "conversations") {
    return CONVERSATION_LESSONS.map((lesson) => ({
      id: lesson.id,
      page,
      title: lesson.title,
      prompt: [
        `A friendly real-life scene titled "${lesson.title}".`,
        `Situation: ${lesson.situation}.`,
        `Show two people naturally having this conversation: ${lesson.lines.map((line) => line.text).join(" ")}`,
      ].join(" "),
    }));
  }

  return EVERYDAY_LESSONS.map((lesson) => ({
    id: lesson.id,
    page,
    title: lesson.title,
    prompt: [
      `A clear real-life English-learning scene titled "${lesson.title}".`,
      `Visually demonstrate the phrase "${lesson.phrase}".`,
      `Meaning: ${lesson.meaning} Example situation: ${lesson.example}`,
    ].join(" "),
  }));
}

export const LESSON_IMAGE_PAGES: LessonImagePage[] = ["sentences", "conversations", "everyday"];

export function isLessonImagePage(value: string | null): value is LessonImagePage {
  return value === "sentences" || value === "conversations" || value === "everyday";
}
