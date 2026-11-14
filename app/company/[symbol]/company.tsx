"use client";
// The company page below the header: four tabs and an ask bar that floats over all of them.
// Documents are read in the background while the figures are already on screen; asking switches to the Ask tab.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Answer, Brief, Doc, Judged, Point } from "../../../lib/research";
import { useThumb } from "../../shell";

type Read = { s: "reading" | "done" | "failed"; total?: number; kept?: number; found?: number };
type QA = { q: string; a?: Answer; err?: boolean };

const TABS = ["Brief", "Numbers", "Documents", "Ask"] as const;
type Tab = (typeof TABS)[number];
const STATUS = { missed: "Missed", met: "Met", early: "Too early", open: "Open" };

// On a desktop the page's pane scrolls, not the window (globals.css); on a phone the window does.
const pane = () => {
  const m = document.querySelector<HTMLElement>("main");
  return m && getComputedStyle(m).overflowY === "auto" ? m : null;
};
const getY = () => pane()?.scrollTop ?? window.scrollY;
const setY = (y: number) => {
  const m = pane();
  if (m) m.scrollTop = y;
  else window.scrollTo(0, y);
};

async function fetchAnswer(symbol: string, question: string): Promise<Answer | null> {
  try {
    const r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, question }) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// suggest: the suggested questions. ask: a question to put at once (sent from an alert). readAt: the date of the frozen read, or "" when the company is read live.
export function Company({ symbol, docs, suggest, ask, readAt, snapshot, numbers }: { symbol: string; docs: Doc[]; suggest: string[]; ask: string; readAt: string; snapshot: ReactNode; numbers: ReactNode }) {
  const [tab, setTab] = useState<Tab>("Brief");
  const [read, setRead] = useState<Record<string, Read>>(() => Object.fromEntries(docs.map((d) => [d.id, { s: "reading" }])));
  const [brief, setBrief] = useState<Brief | "failed" | null>(null);
  const [qa, setQa] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const pos = useRef<Record<string, number>>({});
  const started = useRef(false);
  const lastQ = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const ready = useRef<Record<string, Promise<Answer | null>>>({}); // suggested questions, answered ahead of the tap
  const docsRead = useRef<Promise<unknown>>(Promise.resolve()); // a question waits for this, so it never starts a second read of the same documents
  const api = `/api/research/${encodeURIComponent(symbol)}`;
  const tabsRef = useRef<HTMLDivElement>(null);
  useThumb(tabsRef); // the selected tab's highlight slides, like the nav's

  // Read every document in parallel, then build the brief. Each read is cached, so a return visit is instant.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (ask.length >= 3) queueMicrotask(() => send(ask)); // after the reads below have started
    if (!docs.length) return;
    (async () => {
      const reads = docs.map(async (d) => {
        let next: Read = { s: "failed" };
        try {
          const r = await fetch(`${api}?doc=${encodeURIComponent(d.id)}`);
          if (r.ok) next = { s: "done", ...(await r.json()) };
        } catch {}
        setRead((x) => ({ ...x, [d.id]: next }));
      });
      docsRead.current = Promise.all(reads);
      const load = async (query: string) => {
        try {
          const r = await fetch(api + query);
          return r.ok ? ((await r.json()) as Brief) : null;
        } catch {
          return null;
        }
      };
      // Transcripts are read in seconds; the annual report takes about a minute. Show what the calls give first.
      const calls = reads.filter((_, i) => docs[i].kind === "concall");
      if (calls.length && calls.length < reads.length) {
        await Promise.all(calls);
        const early = await load("?part=calls");
        if (early) setBrief((cur) => cur ?? early);
      }
      await Promise.all(reads);
      setBrief((await load("")) ?? "failed");
      // The documents are read; answer the suggested questions now so a tap shows them at once.
      for (const q of suggest) ready.current[q] ??= fetchAnswer(symbol, q);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; started guards it
  }, [api, docs, symbol]);

  // Each tab remembers where it was scrolled, so coming back from Ask lands where the reader left.
  function go(t: Tab) {
    pos.current[tab] = getY();
    setTab(t);
  }
  useEffect(() => {
    if (asked.current && tab === "Ask") {
      asked.current = false;
      lastQ.current?.scrollIntoView({ block: "start" });
    } else setY(pos.current[tab] ?? 0);
  }, [tab, qa.length]);

  async function send(text: string) {
    const q = text.replace(/\s+/g, " ").trim();
    if (q.length < 3) return;
    setInput("");
    const i = qa.length;
    setQa((x) => [...x, { q }]);
    asked.current = true;
    go("Ask");
    await docsRead.current;
    const a = await (ready.current[q] ?? fetchAnswer(symbol, q));
    setQa((x) => x.map((e, k) => (k === i ? (a ? { q, a } : { q, err: true }) : e)));
  }

  const nDone = docs.filter((d) => read[d.id]?.s !== "reading").length;
  const reading = docs.length > 0 && nDone < docs.length;
  const b = brief && brief !== "failed" ? brief : null;
  const src = (l: { url: string; page: number; title: string }) => (
    <a className="srcl" href={`${l.url}#page=${l.page}`} target="_blank" rel="noreferrer">
      {l.title}, p.{l.page} ↗
    </a>
  );
  const promise = (p: Judged, i: number) => (
    <details key={i} className="pr">
      <summary>
        <span className={`st st-${p.status}`}>{STATUS[p.status]}</span>
        <span className="pl">{p.label}</span>
        {p.got && <span className="pg">{p.got}</span>}
      </summary>
      <div className="pb">
        <p className="said">“{p.quote}”</p>
        {src(p)}
        {p.got ? (
          <p className="got">
            <b>Got</b> {p.got}{" "}
            <button className="lnk" onClick={() => go("Numbers")}>
              Tables ›
            </button>
          </p>
        ) : (
          <p className="got">{p.status === "early" ? "The period this covers has not been reported yet." : "Screener's tables carry no row that tests this one."}</p>
        )}
      </div>
    </details>
  );
  const point = (p: Point, i: number) => (
    <details key={i} className="pr pt">
      <summary>
        <span className="st">{p.head}</span>
        <span className="pl plain">{p.text}</span>
      </summary>
      <div className="pb">
        <p className="said">“{p.quote}”</p>
        {src(p)}
      </div>
    </details>
  );

  return (
    <>
      <div className="tabs seg-host" role="tablist" aria-label="Company sections" ref={tabsRef}>
        <span className="thumb" aria-hidden="true" />
        {TABS.map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} onClick={() => go(t)}>
            {t}
            {t === "Ask" && qa.length > 0 && <span className="c"> {qa.length}</span>}
          </button>
        ))}
      </div>

      <section role="tabpanel" id="panel-Brief" aria-labelledby="tab-Brief" hidden={tab !== "Brief"}>
        {snapshot}
        {docs.length === 0 ? (
          <div className="d-sec">
            <p className="prose">No concall transcripts or annual reports were found for this company.</p>
            <p className="cap" style={{ marginTop: 10 }}>
              FINN answers only from a company&apos;s own documents, so it will not guess. The figures above and the Numbers tab come from its reported results.
            </p>
          </div>
        ) : (
          <>
            {(reading || brief === null) && (
              <button className="prog" onClick={() => go("Documents")}>
                <span className="pulse" aria-hidden="true" />
                {!reading
                  ? "Comparing what was said with the tables"
                  : b
                    ? "Still reading the annual report; the business and risks will follow"
                    : `Reading ${Math.min(nDone + 1, docs.length)} of ${docs.length} documents`}
                <span className="go">Documents ›</span>
              </button>
            )}
            {!readAt && (
              <p className="live">
                <b>First read</b> FINN is reading this company live with a low-cost model. Expect few met or missed verdicts: one is given only when the reported tables prove it, and the rest stay open
                instead of being guessed.
              </p>
            )}
            {brief === "failed" && <p className="warn">The rest of the brief could not be built just now. The figures, Numbers and Ask still work.</p>}
            {b && (
              <>
                <div className="d-sec">
                  <h2>
                    Promised vs delivered <small>decided by arithmetic on the tables</small>
                  </h2>
                  {b.checked.length === 0 ? (
                    <p className="empty">
                      No commitment has a reported outcome yet.{b.guidance.length > 0 && ` ${b.guidance.length} are on record below.`}
                    </p>
                  ) : (
                    <div className="prs">{b.checked.map(promise)}</div>
                  )}
                </div>
                {b.guidance.length > 0 && (
                  <div className="d-sec">
                    <h2>
                      Guidance on record <small>to hold management to</small>
                    </h2>
                    <div className="prs">{b.guidance.map(promise)}</div>
                  </div>
                )}
                {b.call && b.call.said.length > 0 && (
                  <div className="d-sec">
                    <h2>
                      The last call <small>{b.callTitle}, in management&apos;s words</small>
                    </h2>
                    <div className="prs">{b.call.said.map(point)}</div>
                  </div>
                )}
                {b.call && b.call.asked.length > 0 && (
                  <div className="d-sec">
                    <h2>
                      What analysts pressed on <small>{b.callTitle}</small>
                    </h2>
                    <div className="prs">{b.call.asked.map(point)}</div>
                  </div>
                )}
                {b.business.length > 0 && (
                  <div className="d-sec">
                    <h2>The business</h2>
                    <ul className="lines">
                      {b.business.map((l, i) => (
                        <li key={i}>
                          {l.text} {src(l)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {b.risks.length > 0 && (
                  <div className="d-sec">
                    <h2>
                      Risks <small>as the company states them</small>
                    </h2>
                    <ul className="lines">
                      {b.risks.map((l, i) => (
                        <li key={i}>
                          {l.text} {src(l)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {b.failed > 0 && <p className="cap" style={{ marginTop: 12 }}>{b.failed} document(s) could not be read; see Documents.</p>}
              </>
            )}
          </>
        )}
      </section>

      <section role="tabpanel" id="panel-Numbers" aria-labelledby="tab-Numbers" hidden={tab !== "Numbers"}>
        {numbers}
      </section>

      <section role="tabpanel" id="panel-Documents" aria-labelledby="tab-Documents" hidden={tab !== "Documents"}>
        <div className="d-sec">
          <h2>
            Documents <small>the only sources FINN uses here</small>
          </h2>
          {docs.length === 0 && <p className="empty">None found.</p>}
          <ul className="src">
            {docs.map((d) => {
              const r = read[d.id];
              return (
                <li key={d.id}>
                  <a href={d.url} target="_blank" rel="noreferrer">
                    <span className="t">
                      <span className={`rs rs-${r?.s}`} aria-hidden="true">
                        {r?.s === "done" ? "✓" : r?.s === "failed" ? "×" : "…"}
                      </span>{" "}
                      {d.title}
                    </span>
                    <span className="m">
                      {r?.s === "done"
                        ? `${r.total} pages${d.kind === "ar" ? `, ${r.kept} read closely` : ""} · ${r.found} commitments`
                        : r?.s === "failed"
                          ? "could not be read"
                          : "reading"}{" "}
                      ↗
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="cap" style={{ marginTop: 10 }}>
            {readAt ? `Read ahead of time on ${readAt}. ` : ""}The last eight concall transcripts and the latest annual report. Every page is stored and searched when you ask a question. In the annual report, the business overview, management discussion and
            risk sections are also read closely for the brief.
          </p>
        </div>
      </section>

      <section role="tabpanel" id="panel-Ask" aria-labelledby="tab-Ask" hidden={tab !== "Ask"}>
        {qa.length === 0 && (
          <div className="d-sec">
            <h2>Ask Finn about {symbol}</h2>
            <p className="cap">Answered from every page of the documents and from the financial tables. Each sentence carries its source.</p>
            <ul className="sugg">
              {suggest.map((s) => (
                <li key={s}>
                  <button onClick={() => send(s)}>{s}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {qa.map((e, i) => (
          <div className="d-sec qa" key={i} ref={i === qa.length - 1 ? lastQ : undefined}>
            <p className="q">
              <span>Q</span>
              {e.q}
            </p>
            {!e.a && !e.err && (
              <p className="prog static">
                <span className="pulse" aria-hidden="true" />
                {reading ? "Reading the documents first, then answering" : "Finding this in what has been read"}
              </p>
            )}
            {e.err && <p className="warn">That could not be answered just now. Try again.</p>}
            {e.a && (
              <>
                {e.a.answer && (
                  <p className="prose">
                    {e.a.answer.split(/(\[\d+\])/).map((part, k) => (/^\[\d+\]$/.test(part) ? <sup key={k}>{part.slice(1, -1)}</sup> : part))}
                  </p>
                )}
                {e.a.sources.length > 0 && (
                  <ol className="cites">
                    {e.a.sources.map((s) => (
                      <li key={s.n}>
                        <a href={s.page ? `${s.url}#page=${s.page}` : s.url} target="_blank" rel="noreferrer">
                          {s.title}
                          {s.page ? `, p.${s.page}` : ""} ↗
                        </a>
                        {s.quote && <q>{s.quote}</q>}
                      </li>
                    ))}
                  </ol>
                )}
                {e.a.missing && (
                  <p className="miss">
                    <b>Not in the documents</b> {e.a.missing}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </section>

      <form
        className="askbar"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={qa.length ? "Ask Finn a follow-up" : `Ask Finn about ${symbol}`} aria-label={`Ask Finn a question about ${symbol}`} maxLength={300} autoComplete="off" />
        <button aria-label="Send question" disabled={input.trim().length < 3}>
          <svg className="ic" aria-hidden="true">
            <use href="#i-send" />
          </svg>
        </button>
      </form>
    </>
  );
}
