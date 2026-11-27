import { notFound } from "next/navigation";
import { RECIPES, getRecipe } from "@/data/recipes";
import { CookingView } from "@/components/cooking/CookingView";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = getRecipe(slug);
  return { title: r ? `Cooking: ${r.name} · Kitchen OS` : "Cooking · Kitchen OS" };
}

export default async function CookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();
  return <CookingView recipe={recipe} />;
}
