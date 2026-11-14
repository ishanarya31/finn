// An alert now opens inside the feed (PRD 5.6). This address stays so old links still land on the alert.
import { redirect } from "next/navigation";

export default async function Alert({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if ((k === "w" || k === "from") && typeof v === "string") q.set(k, v);
  q.set("a", decodeURIComponent((await params).id));
  redirect(`/?${q}`);
}
