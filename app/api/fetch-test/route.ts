// Diagnostic: can this server reach each data source? Fixed URLs only (not a proxy).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

type Result = { name: string; status: number | string; bytes: number; ms: number; note: string };

async function probe(name: string, url: string, headers: Record<string, string> = {}) {
  const t = Date.now();
  let body = "";
  const r: Result = { name, status: "error", bytes: 0, ms: 0, note: "" };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, ...headers },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    const buf = Buffer.from(await res.arrayBuffer());
    r.status = res.status;
    r.bytes = buf.length;
    r.note = res.headers.get("content-type") ?? "";
    body = buf.toString("latin1");
  } catch (e) {
    r.note = String(e);
  }
  r.ms = Date.now() - t;
  return { r, body };
}

export async function GET() {
  const out: Result[] = [];

  out.push((await probe("yahoo prices", "https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?range=5d&interval=1d")).r);

  const nse = await probe(
    "nse announcements",
    "https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=POLYCAB",
    { Accept: "application/json", Referer: "https://www.nseindia.com/" },
  );
  out.push(nse.r);
  const nsePdf = nse.body.match(/https:\/\/nsearchives\.nseindia\.com\/[^"]+\.pdf/)?.[0];
  if (nsePdf) out.push((await probe("nse filing pdf", nsePdf)).r);

  const scr = await probe("screener page", "https://www.screener.in/company/POLYCAB/consolidated/");
  out.push(scr.r);
  const transcript = scr.body.match(/href="([^"]+)"[^>]*>\s*Transcript/)?.[1];
  const annual = scr.body.match(/href="(https:\/\/www\.bseindia\.com\/bseplus\/AnnualReport\/[^"]+)"/)?.[1];
  const bse = { Referer: "https://www.bseindia.com/" };
  if (transcript) out.push((await probe("bse transcript pdf", transcript, bse)).r);
  if (annual) out.push((await probe("bse annual report pdf (first 1KB)", annual, { ...bse, Range: "bytes=0-1023" })).r);

  return Response.json({ region: process.env.VERCEL_REGION ?? "local", results: out });
}
