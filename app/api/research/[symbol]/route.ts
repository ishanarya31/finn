// Research reads. ?doc=<id> reads one document (so the page can show progress per document);
// with no doc it returns the brief. Everything is cached, so a second call is instant.
import { getBrief, getCompany, isSymbol, readDoc } from "../../../../lib/research";

export const maxDuration = 300; // a first read of an annual report can take a minute or two

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  if (!isSymbol(symbol)) return Response.json({ error: "bad symbol" }, { status: 400 });
  const docId = new URL(req.url).searchParams.get("doc");
  try {
    if (docId) {
      const docs = (await getCompany(symbol))?.docs ?? [];
      const i = docs.findIndex((d) => d.id === docId);
      if (i < 0) return Response.json({ error: "no such document" }, { status: 404 });
      const r = await readDoc(docs[i], i === 0 && docs[i].kind === "concall", symbol); // the first transcript is the latest call
      return Response.json({ total: r.total, kept: r.kept, found: r.said.length });
    }
    const brief = await getBrief(symbol, new URL(req.url).searchParams.get("part") !== "calls");
    return brief ? Response.json(brief) : Response.json({ error: "unknown company" }, { status: 404 });
  } catch (e) {
    console.error("research failed:", symbol, docId, e);
    return Response.json({ error: "could not read" }, { status: 502 });
  }
}
