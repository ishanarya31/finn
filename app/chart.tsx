"use client";
// Closing-price chart: price axis, date axis, range toggle, and a readout under the finger or cursor.
import { useRef, useState } from "react";

type P = { t: number; c: number };
const RANGES = ["1M", "3M", "1Y", "5Y", "MAX"] as const;
const IST = "Asia/Kolkata";
const rupee = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: n < 1000 ? 2 : 0, minimumFractionDigits: n < 1000 ? 2 : 0 });
const axisDate = (t: number, long: boolean) =>
  new Intl.DateTimeFormat("en-IN", long ? { month: "short", year: "2-digit", timeZone: IST } : { day: "numeric", month: "short", timeZone: IST }).format(t);
const fullDate = (t: number) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST }).format(t);

export function Chart({ symbol, initial, mark, start = "3M" }: { symbol: string; initial: P[]; mark?: number; start?: (typeof RANGES)[number] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(start);
  const [pts, setPts] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const req = useRef(0);

  async function pick(r: (typeof RANGES)[number]) {
    const mine = ++req.current; // a slow earlier answer must not overwrite a later choice
    setRange(r);
    setBusy(true);
    setHover(null);
    let next: P[] | null = null;
    try {
      const j = await (await fetch(`/api/prices?symbol=${encodeURIComponent(symbol)}&range=${r}`)).json();
      if (Array.isArray(j) && j.length > 1) next = j;
    } catch {}
    if (mine !== req.current) return;
    if (next) setPts(next);
    setFailed(!next);
    setBusy(false);
  }

  const n = pts.length;
  if (n < 2) return <p className="cap">No price history available.</p>;

  const min = Math.min(...pts.map((p) => p.c));
  const max = Math.max(...pts.map((p) => p.c));
  const pad = (max - min || max * 0.01) * 0.08;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (c: number) => (1 - (c - lo) / (hi - lo)) * 100;

  // The event day, if this range covers it: the nearest point to it.
  let mi = -1;
  if (mark && mark >= pts[0].t && mark <= pts[n - 1].t + 2 * 86400e3)
    mi = pts.reduce((best, p, i) => (Math.abs(p.t - mark) < Math.abs(pts[best].t - mark) ? i : best), 0);

  const long = range === "1Y" || range === "5Y" || range === "MAX";
  const at = hover ?? n - 1;
  const change = (pts[n - 1].c / pts[0].c - 1) * 100;

  return (
    <figure className="chart" aria-busy={busy}>
      <div className="chart-top">
        <p className="chart-read num" aria-live="off">
          <b>₹{rupee(pts[at].c)}</b> <span>{fullDate(pts[at].t)}</span>
        </p>
        <div className="rg" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={r === range} onClick={() => pick(r)}>
              {r === "MAX" ? "Max" : r}
            </button>
          ))}
        </div>
      </div>

      <div className="plot-wrap">
        <div
          className="plot"
          style={{ opacity: busy ? 0.4 : 1 }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <i className="gl" style={{ top: 0 }} />
          <i className="gl" style={{ top: "50%" }} />
          <i className="gl" style={{ top: "100%" }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${symbol} closing price, ${range}, from ₹${rupee(pts[0].c)} to ₹${rupee(pts[n - 1].c)}`}>
            <polyline
              points={pts.map((p, i) => `${x(i).toFixed(2)},${y(p.c).toFixed(2)}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {mi >= 0 && (
            <>
              <i className="vl mk" style={{ left: `${x(mi)}%` }} />
              <i className="dot mk" style={{ left: `${x(mi)}%`, top: `${y(pts[mi].c)}%` }} />
            </>
          )}
          {hover !== null && (
            <>
              <i className="vl" style={{ left: `${x(hover)}%` }} />
              <i className="dot" style={{ left: `${x(hover)}%`, top: `${y(pts[hover].c)}%` }} />
            </>
          )}
        </div>
        <div className="yl num" aria-hidden="true">
          <span>{rupee(hi)}</span>
          <span>{rupee((hi + lo) / 2)}</span>
          <span>{rupee(lo)}</span>
        </div>
        <div className="xl num" aria-hidden="true">
          <span>{axisDate(pts[0].t, long)}</span>
          <span>{axisDate(pts[Math.floor((n - 1) / 2)].t, long)}</span>
          <span>{axisDate(pts[n - 1].t, long)}</span>
        </div>
      </div>

      <figcaption className="cap">
        Close, ₹.{" "}
        <span className={change > 0 ? "up" : change < 0 ? "down" : ""}>
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {Math.abs(change).toFixed(1)}%
        </span>{" "}
        over {range === "MAX" ? "all listed history" : range}.{mi >= 0 && " Marked: the event day."}
        {failed && " Could not load that range; showing the previous one."}
      </figcaption>
    </figure>
  );
}
