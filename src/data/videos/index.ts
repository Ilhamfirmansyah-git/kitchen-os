import type { Video, VideoCategory } from "@/types";

/**
 * Curated public YouTube videos, embedded through YouTube's official IFrame
 * Player API. IDs were collected from public YouTube listings; titles are
 * paraphrased. A video's owner can disable embedding or remove it at any time,
 * so the player handles "unavailable" errors and offers related videos.
 * Channel names are only listed where they were confirmed.
 */
export const VIDEOS: Video[] = [
  {
    id: "t0RdEpWvNdc",
    title: "Indonesian Fried Rice — Nasi Goreng",
    category: "Indonesian",
    description: "A wok-cooked nasi goreng topped with a crispy fried egg.",
    recipeSlug: "nasi-goreng",
    featured: true,
  },
  {
    id: "r3P-x12qvsw",
    title: "Nasi Goreng, Indonesian-Style Fried Rice",
    channel: "Marion's Kitchen",
    category: "Indonesian",
    description: "A punchy chicken nasi goreng with all the trimmings.",
    recipeSlug: "nasi-goreng",
  },
  {
    id: "Lf44Fk7H24s",
    title: "Kimchi Fried Rice (Kimchi-bokkeumbap)",
    channel: "Maangchi",
    category: "Korean",
    description: "A simple, much-loved Korean dish from just a few ingredients.",
    recipeSlug: "kimchi-fried-rice",
    featured: true,
  },
  {
    id: "ls6pAFqtM1E",
    title: "Korean-Style Fried Rice (Bokkeumbap)",
    channel: "Maangchi",
    category: "Korean",
    description: "Classic Korean fried rice with vegetables.",
  },
  {
    id: "ynlphPdUW4U",
    title: "Seafood Kimchi Fried Rice",
    channel: "Maangchi",
    category: "Korean",
    description: "Kimchi fried rice made with fresh seafood.",
  },
  {
    id: "hP8SPMX6MVk",
    title: "Kimchi Fried Rice — Technique Tips",
    category: "Korean",
    description: "Technique-focused take on kimchi bokkeumbap.",
    recipeSlug: "kimchi-fried-rice",
  },
  {
    id: "A4yY7rkzATI",
    title: "Perfect Chicken Teriyaki",
    category: "Japanese",
    description: "Crispy chicken thigh with a simple homemade teriyaki sauce.",
    recipeSlug: "chicken-teriyaki",
    featured: true,
  },
  {
    id: "9MJhVk4Z1Zc",
    title: "Fluffy Japanese Soufflé Pancakes",
    category: "Japanese",
    description: "Tall, jiggly soufflé pancakes using whipped egg whites.",
  },
  {
    id: "PUP7U5vTMM0",
    title: "Gordon Ramsay's Scrambled Eggs",
    channel: "Gordon Ramsay",
    category: "Breakfast",
    description: "The famous on-and-off-the-heat method for creamy scrambled eggs.",
    recipeSlug: "soft-scrambled-eggs",
    featured: true,
  },
  {
    id: "9FxphVeQIN0",
    title: "Easy Thick & Fluffy Pancakes",
    category: "Breakfast",
    description: "A short tutorial for tall, fluffy pancakes.",
    recipeSlug: "fluffy-pancakes",
  },
  {
    id: "RErU22weYyM",
    title: "Spaghetti Carbonara",
    category: "Italian",
    description: "Carbonara with egg, cheese and cured pork.",
    recipeSlug: "spaghetti-carbonara",
  },
  {
    id: "bSYdABrPrtM",
    title: "Basics with Babish: Sourdough Bread (ft. Joshua Weissman)",
    channel: "Babish Culinary Universe",
    category: "Baking",
    description: "A step-by-step sourdough bread lesson.",
  },
  {
    id: "12issg3EdA8",
    title: "Knife Skills: From Holding a Knife to Dicing an Onion",
    category: "Techniques",
    description: "How to hold a chef's knife safely and dice an onion efficiently.",
  },
];

export const VIDEO_CATEGORIES: VideoCategory[] = ["Techniques", "Indonesian", "Korean", "Japanese", "Breakfast", "Italian", "Baking"];

export const getVideo = (id: string) => VIDEOS.find((v) => v.id === id);

export const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
