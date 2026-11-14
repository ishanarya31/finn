// A question about one company, answered from its documents with sources.
// ponytail: no rate limit; this is a single-user demo. Add one before the link is shared widely, since each new question costs a model call.
import { ask, isSymbol } from "../../../lib/research";

export const maxDuration = 300;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const symbol = String(body?.symbol ?? "").toUpperCase();
  const question = String(body?.question ?? "").replace(/\s+/g, " ").trim();
  if (!isSymbol(symbol) || question.length < 3 || question.length > 300) return Response.json({ error: "bad request" }, { status: 400 });
  try {
    return Response.json(await ask(symbol, question)); // cached per symbol and question
  } catch (e) {
    console.error("ask failed:", symbol, e);
    return Response.json({ error: "could not answer" }, { status: 502 });
  }
}
