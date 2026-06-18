import { CategorySelection } from "@/components/play/category-selection";
import { getQuestionDeck } from "@/lib/questions";

export const revalidate = 300;

export default async function Home() {
  const deck = await getQuestionDeck();

  return <CategorySelection deck={deck} />;
}

