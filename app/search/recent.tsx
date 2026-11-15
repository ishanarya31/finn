"use client";
// Suggestions on the Research page: companies this browser opened most recently, then the ready-made ones.
// ponytail: recents live in this browser's localStorage (like "new since last visit"); move to the database if accounts ever exist.
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

const KEY = "finn_recent";
const MAX = 8;
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return ""; // storage blocked: no recents
  }
};

// Mounted on a company page: puts the symbol at the front of the list.
export function Remember({ symbol }: { symbol: string }) {
  useEffect(() => {
    try {
      const list = [symbol, ...read().split(",").filter((s) => s && s !== symbol)].slice(0, MAX);
      localStorage.setItem(KEY, list.join(","));
    } catch {}
  }, [symbol]);
  return null;
}

// Recent first (marked), then the ready-made list; holdings are left out, they have their own section.
export function Suggested({ ready, skip }: { ready: string[]; skip: string[] }) {
  const raw = useSyncExternalStore(() => () => {}, read, () => "");
  const recent = raw.split(",").filter((s) => /^[A-Z0-9&-]{1,20}$/.test(s) && !skip.includes(s));
  const list = [...recent.map((s) => ({ s, r: true })), ...ready.filter((s) => !recent.includes(s)).map((s) => ({ s, r: false }))];
  return (
    <ul className="chips">
      {list.map(({ s, r }) => (
        <li key={s}>
          <Link href={`/company/${encodeURIComponent(s)}`} className={`tk${r ? " rc" : ""}`} title={r ? "Opened recently" : undefined}>
            {r && (
              <svg className="ic" aria-hidden="true">
                <use href="#i-clock" />
              </svg>
            )}
            {s}
          </Link>
        </li>
      ))}
    </ul>
  );
}
