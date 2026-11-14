// "Why it matters" and "what to check next" for an alert.
// With DEEP_SEEK_KEY set, the reasoning model writes them from the facts on the card and nothing else.
// Without it, a fixed checklist per filing type is shown and labelled as such.
import { unstable_cache } from "next/cache";
import { think } from "./llm.ts";

export type Reasoning = { why: string; checks: string[]; by: "model" | "playbook" };

const PLAYBOOK: Record<string, [string, string[]]> = {
  results: [
    "Results are the scheduled test of the reason for owning the stock: growth, margin and cash against what management guided.",
    ["Margin and growth against the guidance given on the last call", "Notes to the results for one-offs: exceptional items, other income, tax rate", "The concall transcript: what analysts pressed on"],
  ],
  management_change: [
    "A change at the top or on the board changes who makes capital-allocation decisions. An unplanned exit matters more than a scheduled one.",
    ["Stated reason and notice period: planned succession or abrupt exit", "The incoming person's record, from the profile in the filing", "Other senior exits over the last few quarters"],
  ],
  mna: [
    "A deal changes capital allocation and the balance sheet. Its size against the company decides whether it touches the thesis.",
    ["Consideration and how it is funded: cash, debt or shares", "Size against net worth and annual operating cash flow", "Related-party involvement, as disclosed in the filing"],
  ],
  litigation: [
    "Orders and penalties range from routine tax disputes to risk to a licence. The amount and the forum decide which this is.",
    ["Amount against annual profit", "Stage of the case and whether the company will appeal", "Earlier contingent-liability disclosure in the annual report"],
  ],
  credit_rating: [
    "A rating action is an outside view of balance-sheet strength and moves borrowing cost. A reaffirmation is routine; a change in rating or outlook is not.",
    ["The action: upgrade, downgrade, outlook change or reaffirmation", "The agency's rationale document", "Debt falling due within 12 months"],
  ],
  pledging: [
    "Pledged promoter shares can be sold by the lender if the price falls, and signal the promoter's own need for cash.",
    ["Pledged shares as a share of promoter holding, before and after", "Who the lender is and the stated purpose", "Trend over the last four quarterly shareholding patterns"],
  ],
  fund_raise: [
    "New capital dilutes holders or adds debt. The price, size and use of funds show how management values its own shares.",
    ["Issue price against market price, and the dilution", "Stated use of proceeds", "Later monitoring-agency reports against that stated use"],
  ],
  move: [
    "A move beyond your thresholds with no filing behind it is either information the market has and you do not, or noise.",
    ["Sector peers on the same day: stock-specific or market-wide", "Bulk and block deal disclosures for the session", "Any clarification the exchange seeks in the next session"],
  ],
};
const FALLBACK: [string, string[]] = [
  "This filing type is on your alert list.",
  ["Read the filing itself, linked below", "Whether it changes anything management said on the last call"],
];

const ask = unstable_cache(
  async (_id: string, facts: string) => {
    const j = await think(
      "You brief a professional long-term fundamental investor who holds this stock. Use ONLY the facts supplied. " +
        "Do not use anything you know about the company, and do not state any number that is not in the facts. " +
        "Never give buy, sell or hold advice or a verdict. If the facts are too thin to judge, say what is not known. " +
        'Reply as JSON: {"why": string, "checks": string[]}. "why": at most 45 words on what this changes for someone ' +
        'holding the stock. "checks": 2 or 3 things to verify next, each at most 14 words, each a concrete document or figure to look at.',
      facts,
      400,
    ); // throws on failure, so a failure is never cached
    const checks = Array.isArray(j.checks) ? j.checks.filter((c: unknown) => typeof c === "string").slice(0, 3) : [];
    if (typeof j.why !== "string" || !j.why.trim() || !checks.length) throw new Error("deepseek: bad shape");
    return { why: j.why.slice(0, 500), checks: checks.map((c: string) => c.slice(0, 160)) };
  },
  ["finn-why-v1"],
  { revalidate: 7 * 86400 }, // one model call per alert; the id and facts are the cache key
);

export async function reason(id: string, cat: string, facts: string): Promise<Reasoning> {
  if (process.env.DEEP_SEEK_KEY) {
    try {
      return { ...(await ask(id, facts)), by: "model" };
    } catch (e) {
      console.error("reasoning model failed, using playbook:", e);
    }
  }
  const [why, checks] = PLAYBOOK[cat] ?? FALLBACK;
  return { why, checks, by: "playbook" };
}
