import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getQuestionDeck } from "@/lib/questions";
import { KhuiDeepPlay } from "@/components/khui-deep-play";
import { SoundProvider } from "@/components/sound-provider";
import PlayLoading from "./loading";

export const revalidate = 300;

type PlayPageProps = {
  params: Promise<{
    category: string;
  }>;
};

async function PlayPageContent({ category }: { category: string }) {
  const deck = await getQuestionDeck();

  // Validate category slug
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

export default async function PlayPage({ params }: PlayPageProps) {
  const { category } = await params;

  return (
    <Suspense fallback={<PlayLoading />}>
      <PlayPageContent category={category} />
    </Suspense>
  );
}
