// FINN Node 1 pipeline: fetch -> classify -> group -> rank.
// Keyword rules and arithmetic only. No model runs anywhere in this file.

export const PORTFOLIO =
  "RELIANCE HDFCBANK INDUSINDBK BAJFINANCE TCS PERSISTENT BHARTIARTL SUNPHARMA MARUTI LT ASIANPAINT VEDL ADANIENT TATAPOWER POLYCAB TRENT PAYTM OLAELEC".split(" ");

// The default demo portfolio. The user edits their own on the Portfolio page; the feed watches whatever is in it.
export const PORTFOLIO_MAX = 25; // each holding costs two requests on a cold load
export const isSymbol = (s: string) => /^[A-Z0-9&-]{1,20}$/.test(s);

// The portfolio cookie is untrusted: keep only ticker-shaped entries, no repeats, capped.
// No cookie means the demo portfolio; an empty cookie means the user removed everything.
export function parsePortfolio(raw?: string): string[] {
  if (raw === undefined) return PORTFOLIO;
  return [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(isSymbol))].slice(0, PORTFOLIO_MAX);
}

// The 17 categories from the brief's appendix.
export const CATEGORIES = {
  results: "Results",
  mna: "M&A",
  fund_raise: "Fund raise",
  management_change: "Management change",
  litigation: "Litigation / regulatory",
  insider_trading: "Insider trading",
  earnings_call: "Earnings call",
  investor_meetings: "Investor meetings",
  credit_rating: "Credit rating",
  dividend: "Dividend",
  bonus_split: "Bonus / split",
  capex: "Capex",
  press_release: "Press release",
  postal_ballot: "Postal ballot",
  agm_egm: "AGM / EGM",
  pledging: "Pledging",
  unclassified: "Routine",
} as const;
export type Cat = keyof typeof CATEGORIES;

const HIDDEN: Cat[] = ["investor_meetings", "postal_ballot", "agm_egm", "unclassified"];
const PRIORITY: string[] = ["results", "management_change", "mna", "litigation", "credit_rating", "pledging", "fund_raise", "move"];

export type Rules = { price: number; vol: number; types: Cat[] };
export const DEFAULT_RULES: Rules = {
  price: 5,
  vol: 2,
  types: ["results", "mna", "management_change", "litigation", "credit_rating", "pledging", "fund_raise"],
};

// Cookie and form input are untrusted: clamp numbers, drop unknown categories.
export function parseRules(raw?: string): Rules {
  try {
    const j = JSON.parse(raw ?? "");
    const num = (v: unknown, lo: number, hi: number, d: number) =>
      v === "" || v == null || !Number.isFinite(Number(v)) ? d : Math.min(hi, Math.max(lo, Number(v)));
    return {
      price: num(j.price, 0.5, 50, DEFAULT_RULES.price),
      vol: num(j.vol, 1.1, 20, DEFAULT_RULES.vol),
      types: Array.isArray(j.types) ? j.types.filter((t: string) => t in CATEGORIES) : DEFAULT_RULES.types,
    };
  } catch {
    return DEFAULT_RULES;
  }
}

export type Filing = { id: string; ts: number; desc: string; text: string; url: string; size: string; cat: Cat };
export type Day = { ts: number; prevTs: number; date: string; close: number; prev: number; pct: number; vol: number; avg: number; mult: number };
export type Item = {
  id: string;
  symbol: string;
  cat: Cat | "move";
  tier: "alert" | "minor" | "hidden";
  ts: number;
  title: string;
  filings: Filing[];
  move?: Day;
};

const DAY_MS = 86400e3;
const IST = 5.5 * 3600e3;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const istDay = (ts: number) => new Date(ts + IST).toISOString().slice(0, 10);

// The quarter a results filing on this date reports: the last quarter-end before it.
export function quarterBefore(ts: number) {
  const d = new Date(ts + IST);
  const m = d.getUTCMonth();
  return `${MON[m < 3 ? 11 : m < 6 ? 2 : m < 9 ? 5 : 8]} ${d.getUTCFullYear() - (m < 3 ? 1 : 0)}`;
}

// ponytail: keyword rules only. Whatever they cannot place lands in "unclassified" (hidden);
// PRD 4.5 step 2 adds a cheap model for those once a model key exists.
export function classify(desc: string, text: string): Cat {
  const d = desc.toLowerCase();
  const t = text.toLowerCase();
  const a = `${d} ${t}`;
  if (/esop|esos|trading window|certificate|monitoring agency|deviation|dematerialis|duplicate|options to purchase/.test(a)) return "unclassified";
  if (d.includes("analysts/institutional")) return /transcript|recording|earnings|con(ference)?\.? ?call/.test(t) ? "earnings_call" : "investor_meetings";
  if (d.includes("newspaper")) return /financial result/.test(a) ? "results" : "unclassified";
  if (d.includes("investor presentation")) return "investor_meetings";
  if (/financial results?|shareholders?'? letter|key performance indicator/.test(a)) return "results";
  if (/pledg|encumbr/.test(a)) return "pledging";
  if (/\brating/.test(a)) return "credit_rating";
  if (/change in director|change in management|appointment|resign|retire|cessation|key managerial/.test(a))
    return /auditor|registrar|transfer agent/.test(a) ? "unclassified" : "management_change";
  if (/action\(s\) taken|orders? passed|insolvency|litigation|dispute|nclt|nclat|penalt|show cause|tribunal|\bcourt\b|\bfine\b|tax demand|demand order/.test(a)) return "litigation";
  if (/allotment of securities|issue of securities|raising of funds|buy-?back|\bqip\b|qualified institution|preferential|rights issue|commercial paper|debenture|\bncds?\b/.test(a)) return "fund_raise";
  if (/takeover regulations|\bsast\b|insider trading/.test(a)) return "insider_trading";
  if (/acquisition|acquire|merger|amalgamation|joint venture|incorporation of|sale or disposal|restructuring|scheme of arrangement|\bstake\b/.test(a)) return "mna";
  if (/bonus|stock split|sub-?division/.test(a)) return "bonus_split";
  if (/dividend|record date/.test(a)) return "dividend";
  if (/capacity addition|capex|capital expenditure|expansion|new plant|commission/.test(a)) return "capex";
  if (/postal ballot/.test(a)) return "postal_ballot";
  if (/shareholders meeting|general meeting|\bagm\b|\begm\b/.test(a)) return "agm_egm";
  if (/press release|media statement|media release|orders\/contracts|bagging|news verification|rumour|clarification/.test(a)) return "press_release";
  return "unclassified";
}

// Strip the exchange's boilerplate lead-in. String work, not a summary.
export function clean(text: string, desc: string) {
  const s =
    (text || desc)
      .replace(/\s+/g, " ")
      .replace(/^.*?\b(limited|ltd\.?)\s+has\s+(informed|submitted)\s+(to\s+)?the\s+exchange,?\s*(about|regarding|that|a copy)?\s*/i, "")
      .replace(/^a (revised )?press release dated [^"']*?titled\s*/i, "")
      .replace(/^(disclosure|intimation)\s+under\s+regulation\s+\d+.*?regulations,?\s*2015\s*(\([^)]*\))?\s*(regarding|[-–:])?\s*/i, "")
      .replace(/^['"‘“]+|['"’”.\s]+$/g, "")
      .trim() || desc || "Filing";
  return s[0].toUpperCase() + s.slice(1);
}

// One row per completed trading day, with the 20-day average volume before it.
export function dayStats(px: any, now: number): Day[] {
  const r = px?.chart?.result?.[0];
  const q = r?.indicators?.quote?.[0];
  if (!r?.timestamp || !q) return [];
  // ponytail: raw Yahoo close. A split or bonus day can read as a large move; switch to adjclose if that bites.
  const b = (r.timestamp as number[])
    .map((t, i) => ({ ts: Date.parse(`${istDay(t * 1000)}T15:30:00+05:30`), close: q.close[i], vol: q.volume[i] }))
    .filter((x) => x.close != null && x.vol != null && x.ts <= now);
  const out: Day[] = [];
  for (let i = 20; i < b.length; i++) {
    const avg = b.slice(i - 20, i).reduce((s, x) => s + x.vol, 0) / 20;
    out.push({
      ts: b[i].ts,
      prevTs: b[i - 1].ts,
      date: istDay(b[i].ts),
      close: b[i].close,
      prev: b[i - 1].close,
      pct: (b[i].close / b[i - 1].close - 1) * 100,
      vol: b[i].vol,
      avg,
      mult: avg ? b[i].vol / avg : 0,
    });
  }
  return out;
}

export const fires = (d: Day, r: Rules) => Math.abs(d.pct) >= r.price || d.mult >= r.vol;

const tierOf = (cat: Cat, r: Rules): Item["tier"] => (r.types.includes(cat) ? "alert" : HIDDEN.includes(cat) ? "hidden" : "minor");
const TIERS = ["alert", "minor", "hidden"];
const prio = (c: string) => (PRIORITY.indexOf(c) + 1 || PRIORITY.length + 1);
const rank = (a: Item, b: Item) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || prio(a.cat) - prio(b.cat) || b.ts - a.ts;

// Several filings about one event become one item. Results group by quarter (notice, outcome,
// newspaper ad, deck); everything else groups by category and day.
export function buildItems(symbol: string, ann: any[], rules: Rules): Item[] {
  const fs: Filing[] = ann
    .map((a) => {
      const url = String(a.attchmntFile ?? "");
      const desc = String(a.desc ?? "");
      const text = String(a.attchmntText ?? "");
      return {
        id: String(a.seq_id),
        ts: Date.parse(`${String(a.sort_date).replace(" ", "T")}+05:30`),
        desc,
        text,
        url: /^https:\/\//.test(url) ? url : "", // feed data is untrusted: only https links are rendered
        size: String(a.attFileSize ?? ""),
        cat: classify(desc, text),
      };
    })
    .filter((f) => Number.isFinite(f.ts))
    .sort((a, b) => a.ts - b.ts);

  const resultDays = new Set(fs.filter((f) => f.cat === "results").map((f) => istDay(f.ts)));
  const groups = new Map<string, Filing[]>();
  for (const f of fs) {
    if (/investor presentation/i.test(f.desc) && resultDays.has(istDay(f.ts))) f.cat = "results";
    const key = f.cat === "results" ? `results-${quarterBefore(f.ts).replace(" ", "")}` : `${f.cat}-${istDay(f.ts)}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }

  return [...groups].map(([key, g]) => {
    const cat = g[0].cat;
    const longest = g.reduce((a, b) => (clean(b.text, b.desc).length > clean(a.text, a.desc).length ? b : a));
    const lead = cat === "results" ? g.find((f) => /outcome of board meeting|financial result/i.test(f.desc)) ?? longest : longest;
    return {
      id: `${symbol}-${key}`,
      symbol,
      cat,
      tier: tierOf(cat, rules),
      ts: cat === "results" ? lead.ts : g[g.length - 1].ts,
      title: clean(lead.text, lead.desc),
      filings: g,
    };
  });
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function grab(url: string, headers: Record<string, string>, revalidate: number, as: "json" | "text") {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, ...headers },
      signal: AbortSignal.timeout(15000),
      next: { revalidate }, // cache what has been read
    } as RequestInit);
    return r.ok ? await r[as]() : null;
  } catch {
    return null;
  }
}

const ddmmyyyy = (ts: number) => istDay(ts).split("-").reverse().join("-");

// 30 days of filings and 3 months of daily prices for every holding. 36 requests, cached 15 minutes.
// ponytail: fetched live and held in Next's data cache; moves to the hosted Postgres when stored cards land (PRD 4.5).
export async function getFeed(rules: Rules, portfolio: string[] = PORTFOLIO, now = Date.now()) {
  const from = now - 30 * DAY_MS;
  const raw = await Promise.all(
    portfolio.map(async (symbol) => {
      const [ann, px] = await Promise.all([
        grab(
          `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${encodeURIComponent(symbol)}&from_date=${ddmmyyyy(from)}&to_date=${ddmmyyyy(now)}`,
          { Accept: "application/json", Referer: "https://www.nseindia.com/" },
          900,
          "json",
        ),
        grab(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=3mo&interval=1d`, {}, 900, "json"),
      ]);
      return { symbol, ann, px };
    }),
  );

  const items: Item[] = [];
  const days: Record<string, Day[]> = {};
  const names: Record<string, string> = {};
  const errors: string[] = [];
  for (const { symbol, ann, px } of raw) {
    if (!Array.isArray(ann)) errors.push(`${symbol} filings`);
    const d = (days[symbol] = dayStats(px, now));
    if (!d.length) errors.push(`${symbol} prices`);
    names[symbol] = px?.chart?.result?.[0]?.meta?.longName ?? symbol;

    const own = buildItems(symbol, Array.isArray(ann) ? ann : [], rules);
    for (const m of d.filter((x) => x.ts >= from && fires(x, rules))) {
      // A move joins the card of a material filing made between the previous close and this one.
      const host = own
        .filter((i) => i.tier !== "hidden" && !i.move && i.filings.some((f) => f.ts > m.prevTs && f.ts <= m.ts))
        .sort(rank)[0];
      if (host) {
        host.move = m;
        host.tier = "alert";
      } else {
        own.push({ id: `${symbol}-move-${m.date}`, symbol, cat: "move", tier: "alert", ts: m.ts, title: "Unusual move", filings: [], move: m });
      }
    }
    items.push(...own);
  }
  return { items: items.sort(rank), days, names, errors, now };
}

// ---- Quarterly results: scraped from screener.in's table, changes by arithmetic ----

export type Results = {
  period: string;
  rows: { label: string; cur: number; qoq: number | null; yoy: number | null }[];
  margin?: { cur: number; prev: number; yoy: number | null };
  url: string;
};

// One of screener's tables, by section id, as raw cell text.
export function parseTable(html: string, id: string) {
  const i = html.indexOf(`id="${id}"`);
  const end = i < 0 ? -1 : html.indexOf("</table>", i);
  if (end < 0) return null;
  const rows = [...html.slice(i, end).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
    ),
  );
  if (rows.length < 2) return null;
  const out: Record<string, string[]> = {};
  for (const r of rows.slice(1)) out[r[0].replace(/\s*\+$/, "")] = r.slice(1);
  return { periods: rows[0].slice(1), rows: out };
}

// Screener's small growth tables ("Compounded Sales Growth: 5 Years 27%"), as { title: { label: value } }.
export function parseRanges(html: string) {
  const out: Record<string, Record<string, string>> = {};
  for (const m of html.matchAll(/<table class="ranges-table">([\s\S]*?)<\/table>/g)) {
    const cells = [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    const rows: Record<string, string> = {};
    for (let i = 1; i + 1 < cells.length; i += 2) if (/\d/.test(cells[i + 1])) rows[cells[i].replace(/:$/, "")] = cells[i + 1];
    if (cells[0]) out[cells[0]] = rows;
  }
  return out;
}

export function parseQuarters(html: string) {
  const t = parseTable(html, "quarters");
  if (!t) return null;
  const rows: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(t.rows)) rows[k] = v.map((x) => (x === "" ? NaN : Number(x.replace(/,/g, ""))));
  return { periods: t.periods, rows };
}

const change = (cur: number, base: number) => (Number.isFinite(cur) && base > 0 ? (cur / base - 1) * 100 : null);

export function buildResults(q: NonNullable<ReturnType<typeof parseQuarters>>, url: string): Results | null {
  const n = q.periods.length;
  if (n < 2) return null;
  const [mon, yr] = q.periods[n - 1].split(" ");
  const y = q.periods.indexOf(`${mon} ${Number(yr) - 1}`); // year-ago quarter, matched by label
  const lender = "Financing Profit" in q.rows; // EBITDA means nothing for a lender, so that row is dropped
  const spec: [string, string[]][] = [
    ["Revenue", ["Sales", "Revenue"]],
    ...(lender ? [] : ([["EBITDA", ["Operating Profit"]]] as [string, string[]][])),
    ["PBT", ["Profit before tax"]],
    ["PAT", ["Net Profit"]],
  ];
  const rows = spec.flatMap(([label, keys]) => {
    const v = q.rows[keys.find((k) => k in q.rows) ?? ""];
    return v && Number.isFinite(v[n - 1])
      ? [{ label, cur: v[n - 1], qoq: change(v[n - 1], v[n - 2]), yoy: y < 0 ? null : change(v[n - 1], v[y]) }]
      : [];
  });
  if (!rows.length) return null;
  const rev = q.rows.Sales;
  const op = q.rows["Operating Profit"];
  const m = (i: number) => (op[i] / rev[i]) * 100;
  const margin = !lender && rev && op && rev[n - 1] > 0 ? { cur: m(n - 1), prev: m(n - 2), yoy: y < 0 ? null : m(y) } : undefined;
  return { period: q.periods[n - 1], rows, margin, url };
}

export async function getResults(symbol: string): Promise<Results | null> {
  for (const path of ["consolidated/", ""]) {
    const url = `https://www.screener.in/company/${symbol}/${path}`;
    const html = await grab(url, {}, 21600, "text");
    const q = html && parseQuarters(html);
    const r = q && buildResults(q, url);
    if (r) return r;
  }
  return null;
}

// ---- Formatting: money in Rs crore with Indian digit grouping (PRODUCT.md) ----

export const inr = (n: number, d = 0) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
export const fmtPct = (n: number | null, d = 0) => (n == null ? "n/m" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}%`);
export const fmtWhen = (ts: number) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(ts);

// Figures are shown on a results card only when screener's latest quarter is the one the filing reports.
export async function resultsFor(item: Item) {
  if (item.cat !== "results") return null;
  const r = await getResults(item.symbol);
  return r && r.period === quarterBefore(item.ts) ? r : null;
}

// ---- Price history for the chart. Daily closes up to a year, weekly for five, monthly beyond. ----

export const RANGES = { "1M": ["1mo", "1d"], "3M": ["3mo", "1d"], "1Y": ["1y", "1d"], "5Y": ["5y", "1wk"], MAX: ["max", "1mo"] } as const;
export type Range = keyof typeof RANGES;

export async function getPrices(symbol: string, range: Range) {
  const [r, i] = RANGES[range];
  const px = await grab(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=${r}&interval=${i}`, {}, 900, "json");
  const res = px?.chart?.result?.[0];
  const c = res?.indicators?.quote?.[0]?.close;
  if (!res?.timestamp || !c) return [];
  return (res.timestamp as number[]).map((t, k) => ({ t: t * 1000, c: c[k] as number })).filter((p) => p.c != null);
}
