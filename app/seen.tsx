"use client";
// "New since last visit". FINN sends no notifications, so the screen has to show what arrived while you were away.
// ponytail: last visit lives in this browser's localStorage; moves to the database if accounts ever exist.
import { useSyncExternalStore } from "react";

let base: number | null = null;

// A visit ends after 30 minutes away. The baseline is when the previous visit was last active.
function baseline() {
  if (base !== null) return base;
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem("finn_last") ?? 0);
    if (now - last > 30 * 60e3) localStorage.setItem("finn_base", String(last));
    localStorage.setItem("finn_last", String(now));
    base = Number(localStorage.getItem("finn_base") ?? 0);
  } catch {
    base = 0; // storage blocked: behave like a first visit
  }
  return base;
}
const subscribe = () => () => {};
const useBase = () => useSyncExternalStore(subscribe, baseline, () => null);

export function New({ ts }: { ts: number }) {
  const b = useBase();
  return b && ts > b ? <b className="new">New</b> : null;
}

export function NewCount({ stamps }: { stamps: number[] }) {
  const b = useBase();
  if (b === null) return null;
  if (b === 0) return null; // first visit: nothing to compare with
  const n = stamps.filter((t) => t > b).length;
  return (
    <span className="newc" title="Since your last visit">
      {n ? <b>{n} new</b> : "nothing new"}
    </span>
  );
}
