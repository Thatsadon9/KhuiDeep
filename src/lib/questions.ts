import { fallbackDeck } from "@/data/fallback-questions";
import { getSupabaseClient } from "@/lib/supabase";
import type { DeepQuestion, QuestionCategory, QuestionDeck } from "@/types";

export async function getQuestionDeck(): Promise<QuestionDeck> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return fallbackDeck;
  }

  const [categoriesResult, questionsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questions")
      .select("*")
      .eq("is_active", true)
      .order("level", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (categoriesResult.error || questionsResult.error) {
    console.error("Supabase question deck error", {
      categories: categoriesResult.error,
      questions: questionsResult.error,
    });
    return fallbackDeck;
  }

  const categories: QuestionCategory[] = (categoriesResult.data ?? []).map(
    (category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      accent: category.accent,
      sortOrder: category.sort_order,
    }),
  );

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const questions: DeepQuestion[] = (questionsResult.data ?? [])
    .map((question) => {
      const category = categoryById.get(question.category_id);

      if (!category) {
        return null;
      }

      return {
        id: question.id,
        categoryId: question.category_id,
        categorySlug: category.slug,
        question: question.question,
        helperText: question.helper_text ?? "",
        level: question.level,
        tags: question.tags ?? [],
      };
    })
    .filter((question): question is DeepQuestion => Boolean(question));

  if (categories.length === 0 || questions.length === 0) {
    return fallbackDeck;
  }

  return {
    categories,
    questions,
    source: "supabase",
  };
}
