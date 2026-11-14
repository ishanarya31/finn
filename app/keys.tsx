"use client";
// Feed keys: J / K move through the alerts shown, Esc goes back from an open alert on a phone. The open card stays in view.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function Keys({ hrefs, cur, close }: { hrefs: string[]; cur: number; close: string }) {
  const router = useRouter();
  const opened = useRef(""); // href of the alert open on a phone, to land back on its card
  useEffect(() => {
    if (matchMedia("(min-width: 980px)").matches) {
      document.querySelector(".card.on")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    // Phone: an opened alert replaces the list, so start it at the top; coming back lands on the card you opened.
    if (close) {
      scrollTo(0, 0);
      opened.current = hrefs[cur] ?? "";
    } else if (opened.current) {
      [...document.querySelectorAll<HTMLAnchorElement>("a.card")].find((c) => c.getAttribute("href") === opened.current)?.scrollIntoView({ block: "center" });
      opened.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hrefs is rebuilt every render; cur and close say when it matters
  }, [cur, close]);
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
