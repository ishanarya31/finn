// The user's portfolio: company names only. Node 1 (the feed and alerts) watches exactly these companies.
import Link from "next/link";
import { cookies } from "next/headers";
import { getFeed, getPrices, isSymbol, parsePortfolio, PORTFOLIO_MAX } from "../../lib/finn";
import { SearchBox } from "../search/box";
import { getPortfolio, getRules } from "../ui";

export const metadata = { title: "Portfolio · FINN" };

// One demo user, no accounts: the list lives in a cookie. ponytail: move to the database with accounts.
const read = async () => parsePortfolio((await cookies()).get("finn_pf")?.value);
const write = async (list: string[]) => (await cookies()).set("finn_pf", list.join(","), { maxAge: 31536000, path: "/", sameSite: "lax" });

// Returns "" on success or a sentence saying why not. The ticker comes from the browser, so it is checked here.
async function add(symbol: string) {
  "use server";
  const s = String(symbol).toUpperCase();
  const cur = await read();
  if (!isSymbol(s)) return "That is not a ticker.";
  if (cur.includes(s)) return `${s} is already in your portfolio.`;
  if (cur.length >= PORTFOLIO_MAX) return `A portfolio holds at most ${PORTFOLIO_MAX} companies. Remove one first.`;
  if (!(await getPrices(s, "1M")).length) return `${s} has no NSE price history, so FINN cannot watch it.`;
  await write([...cur, s]);
  return "";
}

async function remove(fd: FormData) {
  "use server";
  await write((await read()).filter((s) => s !== fd.get("symbol")));
}

export default async function Portfolio() {
  const [rules, portfolio] = await Promise.all([getRules(), getPortfolio()]);
  const { names } = await getFeed(rules, portfolio);

  return (
    <>
      <header className="r-lede">
        <h1>Your portfolio.</h1>
        <p>
          {portfolio.length} {portfolio.length === 1 ? "company" : "companies"}. The feed and its alerts watch these and nothing else. Tap a company to research it.
        </p>
      </header>

      <section className="sec">
        <h2>Add a company</h2>
        <SearchBox onPick={add} placeholder="Add by company name or NSE ticker" />
      </section>

      {portfolio.length === 0 && <p className="empty" style={{ paddingTop: 16 }}>No companies yet. Add one below.</p>}
      <ul className="pf" style={{ marginTop: 22 }}>
        {portfolio.map((s) => (
          <li key={s}>
            <Link href={`/company/${encodeURIComponent(s)}`}>
              <span className="tk">{s}</span>
              <span className="tx">{names[s] === s ? "" : names[s]}</span>
            </Link>
            <form action={remove}>
              <input type="hidden" name="symbol" value={s} />
              <button aria-label={`Remove ${s} from your portfolio`}>Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
