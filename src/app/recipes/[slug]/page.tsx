import { notFound } from "next/navigation";
import { RECIPES, getRecipe } from "@/data/recipes";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = getRecipe(slug);
  return { title: r ? `${r.name} · Kitchen OS` : "Recipe · Kitchen OS" };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getRecipe(slug)) notFound();
  return <RecipeDetail slug={slug} />;
}
