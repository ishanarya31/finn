"use client";
// A threshold input that counts, as you type, how often it would have fired over the last 30 days.
import { useState } from "react";

export function Threshold(p: {
  name: string;
  label: string;
  hint: string;
  before: string;
  after: string;
  step: number;
  min: number;
  max: number;
  initial: number;
  values: { s: string; v: number }[];
}) {
  const [v, setV] = useState(String(p.initial));
  const n = Number(v);
  const hits = v !== "" && n >= p.min ? p.values.filter((x) => x.v >= n) : [];
  return (
    <div className="thr">
      <label className="thr-l" htmlFor={p.name}>
        {p.label}
        <small>{p.hint}</small>
      </label>
      <span className="thr-in">
        {p.before}
        <input id={p.name} name={p.name} type="number" inputMode="decimal" step={p.step} min={p.min} max={p.max} value={v} onChange={(e) => setV(e.target.value)} required />
        {p.after}
      </span>
      <p className="thr-n" aria-live="polite">
        Would have fired <b>{hits.length}</b> {hits.length === 1 ? "time" : "times"} across <b>{new Set(hits.map((x) => x.s)).size}</b> holdings in the last 30 days.
      </p>
    </div>
  );
}
