import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrices } from "../../../lib/finn";
import { frozen, getCompany, SUGGEST } from "../../../lib/research";
import { Chart } from "../../chart";
import { CompanyHead, FiveYears, QuartersTable, Snapshot } from "../../ui";
import { Company } from "./company";
import { Remember } from "../../search/recent";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  return { title: `${decodeURIComponent((await params).symbol).toUpperCase()} · FINN` };
}

export default async function CompanyPage({ params, searchParams }: { params: Promise<{ symbol: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  // A question sent from an alert's ask bar arrives as ?ask=; it is asked as soon as the page opens.
  const { ask } = await searchParams;
  const asked = typeof ask === "string" ? ask.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  const [co, prices] = await Promise.all([getCompany(symbol), getPrices(symbol, "1Y")]);
  if (!co) notFound();
  const at = frozen(co.symbol)?.at; // when this company was read ahead of time, if it was

  return (
    <article className="co">
      <Link href="/search" className="back">
        <svg className="ic" aria-hidden="true">
          <use href="#i-back" />
        </svg>
        Search
      </Link>
      <CompanyHead co={co} />
      <Remember symbol={co.symbol} />

      <Company
        symbol={co.symbol}
        docs={co.docs}
        suggest={SUGGEST}
        ask={asked}
        readAt={at ? new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : ""}
        snapshot={
          <>
            <Snapshot tiles={co.tiles} />
            <FiveYears y={co.years} />
          </>
        }
        numbers={
          <>
            <div className="d-sec">
              <h2>
                Quarterly results <small>₹ crore</small>
              </h2>
              {co.quarters ? <QuartersTable q={co.quarters} /> : <p className="empty">No quarterly table for this company.</p>}
              <p className="cap" style={{ marginTop: 10 }}>
                <a className="srcl" href={co.url} target="_blank" rel="noreferrer">
                  Tables: screener.in ↗
                </a>
              </p>
            </div>
            <div className="d-sec">
              <h2>Price</h2>
              <Chart symbol={co.symbol} initial={prices} start="1Y" />
            </div>
          </>
        }
      />
    </article>
  );
}
