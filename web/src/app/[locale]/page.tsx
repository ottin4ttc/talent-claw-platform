import { redirect } from "next/navigation";

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  redirect("/market");
}
