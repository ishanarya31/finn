"use client";
// Feed keys: J / K move through the alerts shown, Esc closes the alert sheet on a phone. The open card stays in view.
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Keys({ hrefs, cur, close }: { hrefs: string[]; cur: number; close: string }) {
  const router = useRouter();
  useEffect(() => {
    if (matchMedia("(min-width: 980px)").matches) document.querySelector(".card.on")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cur]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input, textarea") || e.metaKey || e.ctrlKey) return;
      const step = e.key === "j" ? 1 : e.key === "k" ? -1 : 0;
      const next = hrefs[Math.min(hrefs.length - 1, Math.max(0, cur + step))];
      if (step && next) {
        e.preventDefault();
        router.push(next, { scroll: false });
      }
      if (e.key === "Escape" && close) router.push(close, { scroll: false });
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [hrefs, cur, close, router]);
  return null;
}
