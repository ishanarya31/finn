"use client";
// Company search. By default a result opens the company page; with onPick it hands the ticker back instead
// (the portfolio page uses that to add a company).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Hit = { symbol: string; name: string };

export function SearchBox({ onPick, placeholder = "Company name or NSE ticker", focus = false }: { onPick?: (symbol: string) => Promise<string>; placeholder?: string; focus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (q.trim().length < 2) return setHits(null);
    let live = true;
    const t = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)).json();
        if (live) setHits(Array.isArray(j) ? j : []);
      } catch {
        if (live) setHits([]);
      }
    }, 220);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  async function choose(symbol: string) {
    if (!/^[A-Z0-9&-]{1,20}$/.test(symbol)) return;
    if (!onPick) return router.push(`/company/${encodeURIComponent(symbol)}`);
    setNote("Adding…");
    const problem = await onPick(symbol);
    setNote(problem || `${symbol} added.`);
    if (!problem) setQ("");
  }

  return (
    <>
      <form
        className="sbox"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          choose(hits?.[0]?.symbol ?? q.trim().toUpperCase()); // Enter takes the top match, or what was typed as a ticker
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setNote("");
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={focus}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
        />
      </form>
      {note && (
        <p className="cap" role="status" style={{ marginTop: 8 }}>
          {note}
        </p>
      )}
      {hits && (
        <ul className="rows hits">
          {hits.map((h) => (
            <li key={h.symbol}>
              {onPick ? (
                <button className="row" onClick={() => choose(h.symbol)}>
                  <span className="tk">{h.symbol}</span>
                  <span className="tx">{h.name}</span>
                  <span className="go">Add +</span>
                </button>
              ) : (
                <Link className="row" href={`/company/${encodeURIComponent(h.symbol)}`}>
                  <span className="tk">{h.symbol}</span>
                  <span className="tx">{h.name}</span>
                  <span className="go">›</span>
                </Link>
              )}
            </li>
          ))}
          {hits.length === 0 && <li className="empty">No listed company matches. Press Enter to try it as a ticker.</li>}
        </ul>
      )}
    </>
  );
}
