// Development only: read one company live and write data/<SYMBOL>.json.gz, the frozen read shipped with the app (PRD 5.5).
// Usage, with `npm run dev` running:  curl -X POST http://localhost:3000/api/freeze/TCS
import { freeze, isSymbol } from "../../../../lib/research";

export async function POST(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 }); // never on the deployed site
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  if (!isSymbol(symbol)) return Response.json({ error: "bad symbol" }, { status: 400 });
  try {
    const r = await freeze(symbol);
    return r ? Response.json(r) : Response.json({ error: "unknown company" }, { status: 404 });
  } catch (e) {
    console.error("freeze failed:", symbol, e);
    return Response.json({ symbol, error: String(e) }, { status: 502 });
  }
}
