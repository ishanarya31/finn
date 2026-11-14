import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES, getFeed, resultsFor, fmtPct, fmtWhen, inr, istDay, type Item, type Results } from "../lib/finn";
import { AlertDetail, DetailLoading } from "./detail";
import { Keys } from "./keys";
import { New, NewCount } from "./seen";
import { Fade, Seg } from "./shell";
import { Delta, getPortfolio, getRules } from "./ui";

export const maxDuration = 60; // the first open of an alert may wait on the reasoning model

const DAY = 86400e3;
const WINDOWS: Record<string, number> = { "24h": 1, "3d": 3, "7d": 7 };
const label = (i: Item) => (i.cat === "move" ? "Unusual move" : CATEGORIES[i.cat]);
const weekday = (ts: number) => new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }).format(ts);

// URL state: w (window), from (custom start), t (alert type shown), a (the open alert).
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [rules, portfolio] = await Promise.all([getRules(), getPortfolio()]);
  const { items, days, names, errors, now } = await getFeed(rules, portfolio);

  // The digest window: last 24 hours unless the user picks another.
  const w = typeof sp.w === "string" && (sp.w in WINDOWS || sp.w === "custom") ? sp.w : "24h";
  const typed = typeof sp.from === "string" && Number.isFinite(Date.parse(`${sp.from}T00:00:00+05:30`)) ? sp.from : istDay(now - 7 * DAY);
  const from = w === "custom" ? Math.max(Date.parse(`${typed}T00:00:00+05:30`), now - 30 * DAY) : now - WINDOWS[w] * DAY;

  const inWin = items.filter((i) => i.ts >= from && i.ts <= now);
  const alerts = inWin.filter((i) => i.tier === "alert");
  const minor = inWin.filter((i) => i.tier === "minor").sort((a, b) => b.ts - a.ts);
  const hidden = inWin
    .filter((i) => i.tier === "hidden")
    .flatMap((i) => i.filings.map((f) => ({ symbol: i.symbol, f })))
    .sort((a, b) => b.f.ts - a.f.ts);
  const quiet = portfolio.filter((s) => !inWin.some((i) => i.symbol === s && i.tier !== "hidden"));

  // Type chips: one per alert type present, in rank order. t filters the list.
  const types = [...new Map(alerts.map((i) => [i.cat, label(i)])).entries()].map(([cat, l]) => ({ cat, l, n: alerts.filter((i) => i.cat === cat).length }));
  const t = typeof sp.t === "string" && types.some((x) => x.cat === sp.t) ? sp.t : "";
  const shown = t ? alerts.filter((i) => i.cat === t) : alerts;
  // The open alert: the one asked for, else the first shown. On a phone the sheet opens only when asked for.
  const asked = typeof sp.a === "string" ? sp.a : "";
  const sel = items.find((i) => i.id === asked) ?? shown[0];

  const url = (o: { w?: string; t?: string; a?: string }) => {
    const q = new URLSearchParams();
    const ww = o.w ?? w;
    if (ww !== "24h") q.set("w", ww);
    if (ww === "custom" && o.w === undefined) q.set("from", typed);
    if ((o.t ?? t) && o.w === undefined) q.set("t", o.t ?? t);
    if (o.a) q.set("a", o.a);
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  // An empty window is normal on a weekend. Point to the nearest wider window that has alerts (PRD 5.5, 1.13).
  const wider =
    alerts.length || !(w in WINDOWS)
      ? undefined
      : Object.entries(WINDOWS)
          .filter(([, d]) => d > WINDOWS[w])
          .map(([k, d]) => ({ k, d, n: items.filter((i) => i.tier === "alert" && i.ts >= now - d * DAY && i.ts <= now).length }))
          .find((x) => x.n > 0);
  const results = new Map<string, Results | null>(await Promise.all(shown.map(async (i) => [i.id, await resultsFor(i)] as const)));

  return (
    <div className="shell">
      <section className="left" aria-label="Feed">
        <div className="lede glass">
          {alerts.length ? (
            <h1>
              <span className="n num">{alerts.length}</span>
              <span>{alerts.length === 1 ? "alert needs review" : "alerts need review"}</span>
            </h1>
          ) : (
            <h1>Nothing needs you.</h1>
          )}
          <p className="sub">
            {w === "custom" ? `Since ${typed}` : `Last ${w === "24h" ? "24 hours" : `${WINDOWS[w]} days`}`} · <b className="num">{minor.length}</b> minor · <b className="num">{hidden.length}</b> routine filings
            hidden · <b className="num">{quiet.length}</b> of {portfolio.length} holdings quiet
          </p>
          {wider && (
            <Link href={url({ w: wider.k })} className="wider">
              <span>
                <b className="num">{wider.n}</b> {wider.n === 1 ? "alert" : "alerts"} in the last {wider.d} days
              </span>
              <svg className="ic" aria-hidden="true">
                <use href="#i-chev" />
              </svg>
            </Link>
          )}
          {types.length > 1 && (
            <nav className="tchips" aria-label="Filter alerts by type">
              <Link href={url({ t: "" })} aria-current={t ? undefined : "true"} scroll={false}>
                All<b className="num">{alerts.length}</b>
              </Link>
              {types.map((x) => (
                <Link key={x.cat} href={url({ t: x.cat })} aria-current={t === x.cat ? "true" : undefined} scroll={false}>
                  {x.l}
                  <b className="num">{x.n}</b>
                </Link>
              ))}
            </nav>
          )}
          <Seg className="win" label="Time window">
            {Object.keys(WINDOWS).map((k) => (
              <Link key={k} href={url({ w: k })} aria-current={w === k ? "true" : undefined}>
                {k}
              </Link>
            ))}
            <Link href={url({ w: "custom" })} aria-current={w === "custom" ? "true" : undefined}>
              Custom
            </Link>
          </Seg>
          {w === "custom" && (
            <form className="custom" method="get">
              <input type="hidden" name="w" value="custom" />
              <label htmlFor="from">Since</label>
              <input id="from" type="date" name="from" defaultValue={typed} min={istDay(now - 30 * DAY)} max={istDay(now)} />
              <button className="btn ghost">Apply</button>
            </form>
          )}
        </div>

        <Fade className="lscroll" tabIndex={-1}>
          {errors.length > 0 && (
            <p className="warn" role="alert">
              Could not read: {errors.join(", ")}. Those holdings may be missing items below.
            </p>
          )}

          <h2 className="sh">
            Alerts <span className="c num">{shown.length}</span>
            <NewCount stamps={[...alerts, ...minor].map((i) => i.ts)} />
            <span className="hint">
              <kbd>J</kbd>
              <kbd>K</kbd> to move
            </span>
          </h2>
          {alerts.length === 0 && (
            <p className="empty">{portfolio.length ? "No filing or move crossed your rules in this window." : "Your portfolio is empty. Add companies on the Portfolio page."}</p>
          )}
          <div className="alerts">
            {shown.map((it, i) => {
              const r = results.get(it.id);
              const rev = r?.rows.find((x) => x.label === "Revenue");
              const pat = r?.rows.find((x) => x.label === "PAT");
              const foot = [
                it.cat === "move" ? "No material filing explains it" : it.move && `Price ${fmtPct(it.move.pct, 1)} · volume ${it.move.mult.toFixed(1)}× 20-day avg`,
                it.filings.length > 1 && `${it.filings.length} filings, one event`,
                it.cat === "results" && !r && "Figures not in the table yet",
              ].filter(Boolean);
              return (
                <Link
                  key={it.id}
                  href={url({ a: it.id })}
                  scroll={false}
                  className={`card ${it.cat === "results" ? "m1" : it.cat === "move" ? "m3" : "m2"}${it.id === sel?.id ? " on" : ""}`}
                  aria-current={it.id === sel?.id ? "true" : undefined}
                  style={{ ["--i" as string]: i }}
                >
                  <span className="mag" aria-hidden="true" />
                  <div className="ch">
                    <span className="tk">{it.symbol}</span>
                    <span className="cat">{label(it)}</span>
                    <span className="when">
                      <New ts={it.ts} />
                      <time dateTime={new Date(it.ts).toISOString()}>
                        {weekday(it.ts)} {fmtWhen(it.ts)}
                      </time>
                    </span>
                  </div>
                  <p className="ln">
                    {rev && pat ? (
                      <>
                        Revenue <b className="num">₹{inr(rev.cur)} cr</b> <Delta v={rev.yoy} /> YoY · PAT <b className="num">₹{inr(pat.cur)} cr</b> <Delta v={pat.yoy} />
                      </>
                    ) : it.cat === "move" && it.move ? (
                      <>
                        Price{" "}
                        <b className="num">
                          <Delta v={it.move.pct} d={1} />
                        </b>{" "}
                        · Volume <b className="num">{it.move.mult.toFixed(1)}×</b> 20-day avg
                      </>
                    ) : (
                      it.title
                    )}
                  </p>
                  {foot.length > 0 && <p className="ft">{foot.join(" · ")}</p>}
                </Link>
              );
            })}
          </div>

          {minor.length > 0 && (
            <>
              <h2 className="sh">
                Minor <span className="c num">{minor.length}</span>
                <span className="d">worth a glance; tap opens the filing</span>
              </h2>
              <ul className="rows glass">
                {minor.slice(0, 4).map(MinorRow)}
                {minor.length > 4 && (
                  <li className="more">
                    <details>
                      <summary>+ {minor.length - 4} more</summary>
                      <ul className="rows">{minor.slice(4).map(MinorRow)}</ul>
                    </details>
                  </li>
                )}
              </ul>
            </>
          )}

          <details className="fold glass">
            <summary>
              Quiet holdings <span className="c num">{quiet.length}</span>
              <span className="d">nothing material; last session&apos;s change</span>
              <svg className="ic chev" aria-hidden="true">
                <use href="#i-chev" />
              </svg>
            </summary>
            <ul className="quiet">
              {quiet.map((s) => {
                const d = days[s]?.at(-1);
                return (
                  <li key={s}>
                    <span className="tk">{s}</span>
                    {d ? (
                      <span className="num">
                        <Delta v={d.pct} d={1} />
                      </span>
                    ) : (
                      <span className="na">no price</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
          <details className="fold glass hid">
            <summary>
              Hidden <span className="c num">{hidden.length}</span>
              <span className="d">routine filings, kept for the record</span>
              <svg className="ic chev" aria-hidden="true">
                <use href="#i-chev" />
              </svg>
            </summary>
            <ul className="rows">
              {hidden.map(({ symbol, f }) => (
                <li key={f.id}>
                  <a className="row" href={f.url || undefined} target="_blank" rel="noreferrer">
                    <span className="tk">{symbol}</span>
                    <span className="tx">{f.desc}</span>
                    <time dateTime={new Date(f.ts).toISOString()}>{fmtWhen(f.ts)}</time>
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <p className="foot">
            Filings: NSE. Prices: Yahoo Finance, end of day; quiet holdings show the last session&apos;s change. Results: screener.in. Read {weekday(now)} {fmtWhen(now)} IST.
          </p>
        </Fade>
      </section>

      <section className="right glass" aria-label="Alert detail">
        {sel ? (
          <Suspense key={sel.id} fallback={<DetailLoading open={!!asked} back={url({})} />}>
            <AlertDetail item={sel} d={days[sel.symbol] ?? []} name={names[sel.symbol] ?? sel.symbol} rules={rules} now={now} back={url({})} open={!!asked} />
          </Suspense>
        ) : (
          <p className="none">{wider ? "Nothing in this window. Try the wider window on the left." : "No alert to open in this window."}</p>
        )}
      </section>
      <Keys hrefs={shown.map((i) => url({ a: i.id }))} cur={shown.findIndex((i) => i.id === sel?.id)} close={asked ? url({}) : ""} />
    </div>
  );
}

// Minor items are one line; tapping opens the source filing.
function MinorRow(it: Item) {
  return (
    <li key={it.id}>
      <a className="row" href={it.filings[0]?.url || undefined} target="_blank" rel="noreferrer" title={`${CATEGORIES[it.cat as keyof typeof CATEGORIES]}: ${it.title}`}>
        <span className="tk">{it.symbol}</span>
        <span className="tx">{it.title}</span>
        <span className="when">
          <New ts={it.ts} />
          <time dateTime={new Date(it.ts).toISOString()}>{fmtWhen(it.ts)}</time>
        </span>
      </a>
    </li>
  );
}
