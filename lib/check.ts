// Self-check for the pipeline logic. Run: node --experimental-strip-types lib/check.ts
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { facts, frozen, tooSoon, locate, lookup, decide, checkable, rankPages, parseDocs, docUrl, safeUrl, isSymbol } from "./research.ts";
import { classify, parsePortfolio, parseRanges, clean, dayStats, fires, parseRules, parseQuarters, buildResults, buildItems, quarterBefore, DEFAULT_RULES } from "./finn.ts";

// classify: real NSE labels and texts seen in the 15 Oct - 14 Nov scan
const C: [string, string, string][] = [
  ["Outcome of Board Meeting", "X Limited has submitted to the Exchange, the unaudited financial results for the quarter", "results"],
  ["Copy of Newspaper Publication", "Newspaper Advertisements in respect of the Unaudited Financial Results", "results"],
  ["Copy of Newspaper Publication", "Newspaper Clippings Proposed Initial Public Offer", "unclassified"],
  ["Trading Window", "Trading Window closure pursuant to SEBI (Prohibition of Insider Trading) Regulations till declaration of financial results", "unclassified"],
  ["Analysts/Institutional Investor Meet/Con. Call Updates", "X has informed the Exchange about Transcript", "earnings_call"],
  ["Analysts/Institutional Investor Meet/Con. Call Updates", "X has informed the Exchange about Schedule of meet", "investor_meetings"],
  ["Change in Director(s)", "regarding Change in Director(s) of the company.", "management_change"],
  ["General Updates", "Approval from the Reserve Bank of India for re-appointment of MD", "management_change"],
  ["Corporate Insolvency Resolution Process", "order passed by NCLAT setting aside the order of NCLT", "litigation"],
  ["Credit Rating", "X has informed the Exchange about Credit Rating", "credit_rating"],
  ["Allotment of Securities", "allotment of 5,74,25,740 securities pursuant to Preferential Issue", "fund_raise"],
  ["ESOP/ESOS/ESPS", "regarding Allotment of 3403 Shares.", "unclassified"],
  ["Acquisition", "Incorporation of Wholly Owned Subsidiary", "mna"],
  ["Bagging/Receiving of orders/contracts", "Bagging/Receiving of orders/contracts", "press_release"],
  ["Capacity addition", "Capacity addition", "capex"],
  ["Updates", "Disclosure under Regulation 30 of the SEBI Listing Regulations", "unclassified"],
  ["Updates", "Operating update for the quarter", "unclassified"], // "operating" must not read as "rating"
  ["Updates", "authorisation granted by the Reserve Bank of India to X, a wholly owned subsidiary of the Company", "unclassified"], // a subsidiary mention is not a deal
];
for (const [d, t, want] of C) assert.equal(classify(d, t), want, `${d} | ${t}`);

assert.equal(clean("HDFC Bank Limited has informed the Exchange regarding Change in Director(s) of the company.", "x"), "Change in Director(s) of the company");
assert.equal(clean("", ""), "Filing");
assert.equal(clean("X Limited has informed the Exchange about Disclosure under Regulation 30 of the SEBI (Listing Obligations and Disclosure Requirements) Regulations,2015 regarding 'In-principle authorisation granted'", "Updates"), "In-principle authorisation granted");

// quarter a filing reports
assert.equal(quarterBefore(Date.parse("2026-11-12T16:03:00+05:30")), "Sep 2026");
assert.equal(quarterBefore(Date.parse("2026-01-20T16:03:00+05:30")), "Dec 2025");

// moves: 21 flat days, then +10% on 3x volume
const t0 = Date.parse("2026-09-01T03:45:00Z") / 1000;
const ts = Array.from({ length: 22 }, (_, i) => t0 + i * 86400);
const px = { chart: { result: [{ timestamp: ts, indicators: { quote: [{ close: [...Array(21).fill(100), 110], volume: [...Array(21).fill(1000), 3000] }] } }] } };
const days = dayStats(px, Date.parse("2027-01-01"));
assert.equal(days.length, 2);
assert.ok(!fires(days[0], DEFAULT_RULES));
assert.ok(Math.abs(days[1].pct - 10) < 1e-9 && Math.abs(days[1].mult - 3) < 1e-9 && fires(days[1], DEFAULT_RULES));
assert.equal(dayStats(px, ts[21] * 1000).length, 1, "a session that has not closed yet is not counted");
assert.deepEqual(dayStats(null, 0), []);

// rules: untrusted input is clamped and unknown categories dropped
assert.deepEqual(parseRules("not json"), DEFAULT_RULES);
assert.deepEqual(parseRules(JSON.stringify({ price: "999", vol: "abc", types: ["results", "<script>"] })), { price: 50, vol: 2, types: ["results"] });

// results: arithmetic on a scraped table; lender variant drops EBITDA
const tbl = (rows: string) => `<section id="quarters"><table><tr><th></th><th>Sep 2025</th><th>Jun 2026</th><th>Sep 2026</th></tr>${rows}</table>`;
const r = buildResults(parseQuarters(tbl("<tr><td>Sales&nbsp;+</td><td>1,000</td><td>1,200</td><td>1,500</td></tr><tr><td>Operating Profit</td><td>100</td><td>120</td><td>300</td></tr><tr><td>Profit before tax</td><td>-5</td><td>90</td><td>250</td></tr><tr><td>Net Profit +</td><td>60</td><td>70</td><td>200</td></tr>"))!, "u")!;
assert.equal(r.period, "Sep 2026");
assert.deepEqual(r.rows.map((x) => x.label), ["Revenue", "EBITDA", "PBT", "PAT"]);
assert.equal(r.rows[0].qoq, 25);
assert.equal(r.rows[0].yoy, 50);
assert.equal(r.rows[2].yoy, null, "growth off a negative base is not meaningful");
assert.equal(r.margin!.cur, 20);
const bank = buildResults(parseQuarters(tbl("<tr><td>Revenue +</td><td>10</td><td>11</td><td>12</td></tr><tr><td>Financing Profit</td><td>1</td><td>1</td><td>1</td></tr><tr><td>Profit before tax</td><td>3</td><td>3</td><td>4</td></tr><tr><td>Net Profit +</td><td>2</td><td>2</td><td>3</td></tr>"))!, "u")!;
assert.deepEqual(bank.rows.map((x) => x.label), ["Revenue", "PBT", "PAT"]);
assert.equal(parseQuarters("<html></html>"), null);

// grouping: results filings across two days fold into one item; javascript: links are dropped
const ann = [
  { seq_id: 1, sort_date: "2026-11-12 16:03:19", desc: "Outcome of Board Meeting", attchmntText: "unaudited financial results for the quarter", attchmntFile: "https://nsearchives.nseindia.com/a.pdf" },
  { seq_id: 2, sort_date: "2026-11-12 16:19:14", desc: "Investor Presentation", attchmntText: "Investor Presentation", attchmntFile: "javascript:alert(1)" },
  { seq_id: 3, sort_date: "2026-11-13 13:51:26", desc: "Copy of Newspaper Publication", attchmntText: "Newspaper Advertisements in respect of the Financial Results" },
  { seq_id: 4, sort_date: "2026-11-13 11:00:00", desc: "ESOP/ESOS/ESPS", attchmntText: "Allotment of 10 Shares" },
];
const items = buildItems("X", ann, DEFAULT_RULES);
assert.equal(items.length, 2);
const res = items.find((i) => i.cat === "results")!;
assert.equal(res.filings.length, 3);
assert.equal(res.tier, "alert");
assert.equal(res.ts, Date.parse("2026-11-12T16:03:19+05:30"), "a later newspaper ad must not make old results look new");
assert.equal(res.filings[1].url, "");
assert.equal(items.find((i) => i.cat === "unclassified")!.tier, "hidden");

// ---- Node 2 ----
// quotes are located by text, not by the page a model claims
const pages: [number, string][] = [[5, "We expect EBITDA margins of 11 to 13 percent for the full year."], [6, "Capex will be Rs 1,200 crore in FY27, funded from internal accruals."]];
assert.equal(locate(pages, "capex will be Rs 1,200 crore in FY27", 5), 6, "wrong page hint is corrected");
assert.equal(locate(pages, "we will double revenue in three years", 5), 0, "an invented quote is rejected");
assert.equal(locate(pages, "FY27", 6), 0, "too short to count as a quote");

// a verdict is a table lookup and a comparison, not a model's opinion
const tables = "## Quarterly results, Rs crore\nPeriod: Jun 2026 | Sep 2026\nSales: 8,210 | 9,899\nOPM %: 14% | 16%\n## Ratios (days, ROCE)\nPeriod: Mar 2025 | Mar 2026\nWorking Capital Days: 41 | 30";
assert.deepEqual(lookup(tables, "OPM %", "Sep 2026"), { cell: "16%", value: 16 });
assert.equal(lookup(tables, "sales", "Jun 2026")!.value, 8210);
assert.equal(lookup(tables, "Working Capital Days", "Mar 2026")!.value, 30, "the period is read from the row's own table");
assert.equal(lookup(tables, "OPM %", "Dec 2026"), null);
assert.equal(lookup(tables, "Capex", "Sep 2026"), null);
assert.equal(decide(16, 11, 13, "within"), "met", "above a promised margin range is delivered");
assert.equal(decide(10, 11, 13, "within"), "missed");
assert.equal(decide(30, 50, 55, "within", true), "met", "fewer working-capital days than promised is delivered");
assert.equal(decide(60, 50, 55, "within", true), "missed");
// a company-wide row is only used for a company-wide commitment about the same measure
assert.ok(checkable("Sales", "Revenue ~INR56,000 cr in FY27"));
assert.ok(!checkable("Sales", "Telecom revenue ~INR5,200 crore FY26"), "a segment is not the company");
assert.ok(!checkable("Sales", "FY26 capex INR1,100-1,200 crore"), "capex is not sales");
assert.ok(!checkable("OPM %", "W&C EBITDA margin 11-13% long term"));
assert.ok(checkable("OPM %", "EBITDA margin 11-13% long term")?.[2] === false);
assert.ok(checkable("Working Capital Days", "Working capital 50-55 days")?.[2] === true);
assert.ok(!checkable("Cash from Investing Activity", "Capex ₹12-16bn annually"));
assert.equal(decide(40, 20, null, "at_least"), "met", "beating a floor is met");
assert.equal(decide(4264, null, 1800, "at_most"), "missed");
assert.equal(decide(5, null, null, "within"), "open");

// a promise made after the last reported quarter cannot be judged yet
assert.ok(tooSoon("Concall, Nov 2026", "Sep 2026"));
assert.ok(!tooSoon("Concall, Aug 2026", "Sep 2026"));
assert.ok(!tooSoon("Annual report FY26", "Sep 2026"));
assert.ok(!tooSoon("Concall, Feb 2026", "Dec 2026") && tooSoon("Concall, Jan 2027", "Dec 2026"));

// retrieval puts the page that answers the question first
const pool = [{ text: "Welcome to the call. Operator instructions follow." }, { text: "On margins, we guide to EBITDA margin of 11-13% and expect it to hold." }, { text: "Our dealer network grew in the south." }];
assert.equal(rankPages(pool, "What did they guide on margins?", 1)[0], pool[1]);

// document links: last four transcripts and the latest annual report; non-https links dropped
const scr = `<div class="documents concalls"><ul class="list-links">
<li><div class="ink-600">Oct 2026</div><a class="button-chip" href="https://www.bseindia.com/a.pdf" title="Raw Transcript">Transcript</a></li>
<li><div class="ink-600">Jul 2026</div><a class="button-chip" href="http://insecure.example.com/b.pdf" title="Raw Transcript">Transcript</a></li>
<li><div class="ink-600">May 2026</div><a href="https://x.example.com/ppt.pdf" class="button-chip">PPT</a></li>
</ul></div><div class="documents annual-reports"><ul class="list-links"><li><a href="https://www.bseindia.com/ar26.pdf" class="x">Annual Report 2026</a></li><li><a href="https://www.bseindia.com/ar25.pdf">Annual Report 2025</a></li></ul></div>`;
assert.deepEqual(parseDocs(scr).map((d) => d.id), ["concall-Oct2026", "ar-2026"]);
const li = (m: string) => `<li><div class="ink-600">${m}</div><a class="button-chip" href="https://www.bseindia.com/${m.length}.pdf" title="Raw Transcript">Transcript</a></li>`;
assert.deepEqual(parseDocs(`<div class="documents concalls"><ul>${li("Jul 2026")}${li("Jul 2026")}${li("Apr 2026")}</ul></div>`).map((d) => d.id), ["concall-Jul2026", "concall-Jul2026-2", "concall-Apr2026"], "two calls in one month get distinct ids");
assert.equal(safeUrl("https://127.0.0.1/x.pdf"), "");
assert.equal(safeUrl("javascript:alert(1)"), "");
// a viewer page is unwrapped to the file on the same host; it cannot be pointed at another host
assert.equal(docUrl("https://www.x.com/pdf-viewer?pdf=%2Fcontent%2Fdam%2Fq2.pdf"), "https://www.x.com/content/dam/q2.pdf");
assert.equal(docUrl("https://www.x.com/pdf-viewer?pdf=%2F%2Fevil.com%2Fq2.pdf"), "https://www.x.com/pdf-viewer?pdf=%2F%2Fevil.com%2Fq2.pdf");
assert.equal(docUrl("https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=a-1.pdf"), "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=a-1.pdf");
assert.ok(isSymbol("M&M") && !isSymbol("../etc") && !isSymbol("dixon"));

// snapshot tiles and five years: arithmetic on scraped tables
const T = (id: string, head: string, rows: string) => `<section id="${id}"><table><tr><th></th>${head.split("|").map((h) => `<th>${h}</th>`).join("")}</tr>${rows.split(";").map((r) => `<tr>${r.split("|").map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></section>`;
const page =
  T("profit-loss", "Mar 2024|Mar 2025|Mar 2026|TTM", "Sales +|100|200|300|330;Sales growth|+10%|+100%|+50%|;OPM %|10%|12%|14%|15%;Net Profit +|10|20|30|36") +
  T("balance-sheet", "Mar 2025|Mar 2026", "Equity Capital|10|10;Reserves|90|190;Borrowings +|40|50") +
  T("cash-flow", "Mar 2024|Mar 2025|Mar 2026", "Cash from Operating Activity +|5|25|36;Free Cash Flow|-2|10|20") +
  T("ratios", "Mar 2025|Mar 2026", "Cash Conversion Cycle|40|-7;ROCE %|20%|25%") +
  `<table class="ranges-table"><tr><th colspan="2">Compounded Sales Growth</th></tr><tr><td>5 Years:</td><td>27%</td></tr><tr><td>3 Years:</td><td>30%</td></tr></table>`;
assert.deepEqual(parseRanges(page), { "Compounded Sales Growth": { "5 Years": "27%", "3 Years": "30%" } });
const f = facts(page);
const tile = (start: string) => f.tiles.find((t) => t.label.startsWith(start))!;
assert.equal(tile("Sales").value, "₹330 cr");
assert.equal(tile("Sales").note, "27% a year over 5 years");
assert.equal(tile("Borrowings").note, "0.25× equity", "50 / (10 + 190)");
assert.equal(tile("Cash from operations").value, "110% of profit", "(5 + 25 + 36) / (10 + 20 + 30)");
assert.equal(tile("Operating margin").value, "15%");
assert.deepEqual(f.years!.periods, ["Mar 2024", "Mar 2025", "Mar 2026"]);
assert.deepEqual(f.years!.rows.find((r) => r[0] === "Free cash flow")![1], ["-2", "10", "20"]);
assert.deepEqual(facts("<html></html>"), { tiles: [], years: null });
// rows added for checking commitments
assert.ok(checkable("Sales growth", "Revenue growth 15-17% in FY27"));
assert.ok(checkable("Free Cash Flow", "Free cash flow above ₹500 cr in FY27"));
assert.ok(checkable("Cash Conversion Cycle", "Cash conversion cycle under 30 days")?.[2] === true);

// portfolio cookie: default when absent, empty when emptied, junk dropped, capped
assert.equal(parsePortfolio(undefined).length, 18);
assert.deepEqual(parsePortfolio(""), []);
assert.deepEqual(parsePortfolio("tcs, ../x ,TCS,IEX,<b>"), ["TCS", "IEX"]);
assert.equal(parsePortfolio(Array.from({ length: 40 }, (_, i) => `S${i}`).join(",")).length, 25);

// frozen reads (data/*.json.gz): a bad name reads as "not frozen"; every file parses, and every quote in it is
// found on the page it cites. A frozen read must be as grounded as a live one.
assert.equal(frozen("../x"), null);
assert.equal(frozen("NOSUCHCO"), null);
const files = existsSync("data") ? readdirSync("data").filter((f) => f.endsWith(".json.gz")) : [];
for (const file of files) {
  const fz = frozen(file.replace(".json.gz", ""))!;
  assert.ok(fz?.stamp && Object.keys(fz.docs).length, `${file}: unreadable or empty`);
  for (const [url, d] of Object.entries(fz.docs)) for (const s of d.said) assert.ok(locate(d.pages, s.quote, s.page) === s.page, `${file}: quote not on its page, ${url} p.${s.page}`);
  for (const p of [...(fz.brief?.checked ?? []), ...(fz.brief?.guidance ?? [])]) assert.ok(fz.docs[p.url] && locate(fz.docs[p.url].pages, p.quote, p.page), `${file}: brief quote not in its document`);
}

console.log(`finn checks pass (${files.length} frozen reads)`);
