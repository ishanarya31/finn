import Link from "next/link";
import { DEMO, frozen } from "../../lib/research";
import { getPortfolio } from "../ui";
import { SearchBox } from "./box";

export const metadata = { title: "Research · FINN" };

const Chips = ({ list }: { list: string[] }) => (
  <ul className="chips">
    {list.map((s) => (
      <li key={s}>
        <Link href={`/company/${encodeURIComponent(s)}`} className="tk">
          {s}
        </Link>
      </li>
    ))}
  </ul>
);

export default async function Search() {
  const portfolio = await getPortfolio();
  const read = portfolio.filter((s) => frozen(s)).length;
  return (
    <>
      <header className="r-lede">
        <h1>Research any NSE company.</h1>
        <p>Answers come from the company&apos;s own annual report and concall transcripts, with the page cited. No news, no broker notes.</p>
      </header>
      <SearchBox focus />
      <section className="sec">
        <h2>Read and ready</h2>
        <p className="cap">Documents already read. These open at once.</p>
        <Chips list={DEMO} />
      </section>
      <section className="sec">
        <h2>Your portfolio</h2>
        <p className="cap">{read === portfolio.length ? "All read ahead of time." : `${read} of ${portfolio.length} read ahead of time.`}</p>
        <Chips list={portfolio} />
      </section>
      <p className="foot">
        Any other company is read live on first visit, by a low-cost model: figures appear at once, transcripts within a minute, the annual report after that. Expect fewer verdicts there; FINN leaves a
        commitment open when the reported tables cannot prove it.
      </p>
    </>
  );
}
