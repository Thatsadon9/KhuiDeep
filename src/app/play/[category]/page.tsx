import { redirect } from "next/navigation";
import { getQuestionDeck } from "@/lib/questions";
import { KhuiDeepPlay } from "@/components/khui-deep-play";
import { SoundProvider } from "@/components/sound-provider";

export const revalidate = 300;

type PlayPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { category } = await params;
  const deck = await getQuestionDeck();

  const validSlugs = ["all", ...deck.categories.map((cat) => cat.slug)];
  if (!validSlugs.includes(category)) {
    redirect("/");
  }

  return (
    <SoundProvider>
      <KhuiDeepPlay deck={deck} categorySlug={category} />
    </SoundProvider>
  );
}
