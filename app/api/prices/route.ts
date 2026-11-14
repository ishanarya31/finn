// Closing prices for the chart's range toggle. Input is validated: ticker shape and a fixed list of ranges.
import { getPrices, RANGES, type Range } from "../../../lib/finn";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const symbol = q.get("symbol") ?? "";
  const range = q.get("range") ?? "";
  if (!/^[A-Z0-9&-]{1,20}$/.test(symbol) || !Object.hasOwn(RANGES, range)) return Response.json({ error: "bad request" }, { status: 400 });
  return Response.json(await getPrices(symbol, range as Range));
}
