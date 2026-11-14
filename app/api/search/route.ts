// Company search by name or ticker, through screener.in's search. Only companies with an exchange ticker are returned.
import { grab } from "../../../lib/finn";
import { isSymbol } from "../../../lib/research";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) return Response.json([]);
  const j = await grab(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(q)}`, {}, 86400, "json");
  const out = (Array.isArray(j) ? j : [])
    .map((c: any) => ({ symbol: String(c?.url ?? "").match(/^\/company\/([^/]+)\//)?.[1] ?? "", name: String(c?.name ?? "") }))
    .filter((c) => isSymbol(c.symbol) && !/^\d+$/.test(c.symbol)) // a purely numeric code is a BSE-only listing
    .slice(0, 8);
  return Response.json(out);
}
