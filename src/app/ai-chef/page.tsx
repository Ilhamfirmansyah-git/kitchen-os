import { Page, PageHeader } from "@/components/layout/Page";
import { ChefChat } from "@/components/ai/ChefChat";

export const metadata = { title: "AI Chef · Kitchen OS" };

export default function AIChefPage() {
  return (
    <Page className="pb-10">
      <PageHeader title="AI Chef" subtitle="Recipe ideas, substitutes, troubleshooting and meal plans." />
      <ChefChat />
    </Page>
  );
}
