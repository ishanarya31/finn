// The alert detail: what happened, why it matters, what to check next, sources. On a desktop it fills the feed's right
// pane; on a phone it opens as a full-screen sheet over the feed (PRD 4.6 1.8-1.12, 5.6).
import Link from "next/link";
import { CATEGORIES, getPrices, resultsFor, fires, fmtPct, fmtWhen, inr, type Day, type Item, type Rules } from "../lib/finn";
import { reason } from "../lib/reason";
import { getCompany } from "../lib/research";
import { Chart } from "./chart";
import { Fade } from "./shell";
import { CompanyHead, MoveLine, ResultsTable } from "./ui";

const Icon = ({ n }: { n: string }) => (
  <svg className="ic" aria-hidden="true">
    <use href={`#i-${n}`} />
  </svg>
);

export async function AlertDetail({ item, d, name, rules, now, back, open }: { item: Item; d: Day[]; name: string; rules: Rules; now: number; back: string; open: boolean }) {
  const label = item.cat === "move" ? "Unusual move" : CATEGORIES[item.cat];
  const [r, prices, co] = await Promise.all([resultsFor(item), getPrices(item.symbol, "3M"), getCompany(item.symbol)]); // co: the screener page resultsFor reads, already cached
  const m = item.move;
  // For a filing with no move attached: the first close after it. Did the market care?
  const after = m ?? d.find((x) => x.ts >= item.ts);
  const fired = d.filter((x) => x.ts >= now - 30 * 86400e3 && fires(x, rules)).length;

  // Arithmetic observations. These are computed, not written by a model.
  const notes: React.ReactNode[] = [];
  if (r) {
    const rev = r.rows.find((x) => x.label === "Revenue");
    const pat = r.rows.find((x) => x.label === "PAT");
    if (rev?.yoy != null && pat?.yoy != null)
      notes.push(
        <>
          PAT <b>{fmtPct(pat.yoy)}</b> against revenue <b>{fmtPct(rev.yoy)}</b> year on year: profit grew {pat.yoy > rev.yoy ? "faster" : "slower"} than sales.
        </>,
      );
    if (r.margin)
      notes.push(
        <>
          EBITDA margin <b>{r.margin.cur.toFixed(1)}%</b>, against <b>{r.margin.prev.toFixed(1)}%</b> last quarter
          {r.margin.yoy != null && (
            <>
              {" "}
              and <b>{r.margin.yoy.toFixed(1)}%</b> a year ago
            </>
          )}
          .
        </>,
      );
  }
  if (m)
    notes.push(
      <>
        <b>{fired}</b> {fired === 1 ? "session" : "sessions"} beyond your thresholds for {item.symbol} in the last 30 days.{" "}
        {fired <= 1 ? "This is rare for the stock." : fired >= 5 ? "This stock crosses them often." : ""}
      </>,
    );
  else if (after)
    notes.push(
      <>
        First close after the filing: <b>{fmtPct(after.pct, 1)}</b> on <b>{after.mult.toFixed(1)}×</b> average volume. No threshold crossed.
      </>,
    );

  // The only text the reasoning model sees. It is told to use nothing else.
  const facts = [
    `Company: ${name} (${item.symbol})`,
    `Alert type: ${label}`,
    `Time (IST): ${fmtWhen(item.ts)}`,
    ...item.filings.map((f) => `Exchange filing [${f.desc}]: ${f.text}`),
    r && `Quarterly results, Rs crore, ${r.period}: ${r.rows.map((x) => `${x.label} ${inr(x.cur)} (QoQ ${fmtPct(x.qoq)}, YoY ${fmtPct(x.yoy)})`).join("; ")}`,
    r?.margin && `EBITDA margin: ${r.margin.cur.toFixed(1)}% now, ${r.margin.prev.toFixed(1)}% previous quarter${r.margin.yoy != null ? `, ${r.margin.yoy.toFixed(1)}% a year ago` : ""}`,
    after && `Price on ${after.date}: close Rs ${inr(after.close, 2)}, ${fmtPct(after.pct, 1)} on the day, volume ${after.mult.toFixed(1)}x the 20-day average`,
    m && `The user's thresholds: price beyond ±${rules.price}%, volume above ${rules.vol}x. Sessions beyond them in the last 30 days: ${fired}`,
    item.cat === "move" && "No material filing from the company between the previous close and this one.",
  ]
    .filter(Boolean)
    .join("\n");
  const why = await reason(item.id, item.cat, facts);

  return (
    <article className={`detail${open ? " open" : ""}`} aria-label={`${item.symbol} alert`}>
      <Fade className="dscroll" key={item.id}>
        <Link href={back} className="back" scroll={false}>
          <Icon n="back" />
          Feed
        </Link>

        <CompanyHead co={co ?? { symbol: item.symbol, name }}>
          <p className="badge">
            <span className="pill">{label}</span>
            <time dateTime={new Date(item.ts).toISOString()}>{fmtWhen(item.ts)} IST</time>
          </p>
        </CompanyHead>

        <section className="d-sec">
          <h2>What happened</h2>
          {item.cat !== "move" && <p className="fact">{item.title}.</p>}
          {r && <ResultsTable r={r} />}
          {item.cat === "results" && !r && <p className="cap">The figures for this quarter are not in screener.in&apos;s table yet. Open the filing below.</p>}
          {m && <MoveLine m={m} rules={rules} />}
          {m && (
            <p className="cap num">
              Close ₹{inr(m.close, 2)} from ₹{inr(m.prev, 2)} · {inr(m.vol)} shares against a {inr(Math.round(m.avg))} average
            </p>
          )}
          <Chart symbol={item.symbol} initial={prices} mark={after?.ts} />
        </section>

        <section className="d-sec">
          <h2>
            Why it matters
            {why.by === "playbook" && <small>Standard note for this alert type</small>}
          </h2>
          <p className="prose">{why.why}</p>
          {notes.length > 0 && (
            <ul className="facts">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="d-sec">
          <h2>
            What to check next <small>tap to ask Finn</small>
          </h2>
          {/* Each check is a question for Node 2: the company page opens on Ask with it already asked (PRD 5.7, 1.14). */}
          <ol className="checks">
            {why.checks.map((c) => (
              <li key={c}>
                <Link href={`/company/${encodeURIComponent(item.symbol)}?ask=${encodeURIComponent(c)}`}>
                  <span className="t">{c}</span>
                  <Icon n="chev" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="d-sec">
          <h2>Sources</h2>
          <ul className="src">
            {item.filings.map((f) => (
              <li key={f.id}>
                <a href={f.url || undefined} target="_blank" rel="noreferrer">
                  <span className="t">{f.desc}</span>
                  <span className="m">
                    {fmtWhen(f.ts)}
                    {f.size && ` · ${f.size}`}
                  </span>
                  <Icon n="out" />
                </a>
              </li>
            ))}
            {r && (
              <li>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <span className="t">Quarterly table, screener.in</span>
                  <span className="m">₹ crore</span>
                  <Icon n="out" />
                </a>
              </li>
            )}
            <li>
              <span className="nolink">
                <span className="t">Prices and volumes</span>
                <span className="m">Yahoo Finance, end of day</span>
              </span>
            </li>
          </ul>
        </section>

        <Link href={`/company/${encodeURIComponent(item.symbol)}`} className="dig">
          <span>
            <b>Research {item.symbol}</b>
            <small>Promised vs delivered, the numbers, and questions answered from its filings</small>
          </span>
          <Icon n="chev" />
        </Link>
      </Fade>

      {/* A plain form: the question goes to the company page, which opens on its Ask tab with the answer (PRD 5.5, 1.12). */}
      <form className="askbar" action={`/company/${encodeURIComponent(item.symbol)}`}>
        <input name="ask" placeholder={`Ask Finn about ${item.symbol}`} aria-label={`Ask Finn a question about ${item.symbol}`} required minLength={3} maxLength={300} autoComplete="off" />
        <button aria-label="Send question">
          <Icon n="send" />
        </button>
      </form>
    </article>
  );
}

export function DetailLoading({ open, back }: { open: boolean; back: string }) {
  return (
    <article className={`detail${open ? " open" : ""}`} aria-busy="true">
      <div className="dscroll">
        <Link href={back} className="back" scroll={false}>
          <Icon n="back" />
          Feed
        </Link>
        <p className="prog static">
          <span className="pulse" aria-hidden="true" />
          Reading the filing and writing why it matters…
        </p>
      </div>
    </article>
  );
}
