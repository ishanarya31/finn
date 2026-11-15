import Link from "next/link";
import { DEMO } from "../../lib/research";
import { getPortfolio } from "../ui";
import { SearchBox } from "./box";
import { Suggested } from "./recent";

export const metadata = { title: "Research · FINN" };

export default async function Search() {
  const portfolio = await getPortfolio();
  return (
    <>
      <header className="r-lede">
        <h1>Research any NSE company.</h1>
        <p>Answers come from the company&apos;s own annual report and concall transcripts, with the page cited. No news, no broker notes.</p>
      </header>
      <SearchBox focus />
      <section className="sec">
        <h2>Suggested</h2>
        <p className="cap">Pick up where you left off, or start with one of these.</p>
        <Suggested ready={DEMO} skip={portfolio} />
      </section>
      <section className="sec">
        <h2>Your holdings</h2>
        <p className="cap">Every company you hold, ready to research.</p>
        <ul className="chips">
          {portfolio.map((s) => (
            <li key={s}>
              <Link href={`/company/${encodeURIComponent(s)}`} className="tk">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
