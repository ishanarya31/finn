# FINN — known problems and what comes next

Written 14 Nov 2026, the day before submission. This is the honest list: what FINN does badly or not at all today, why, and what would be built next. The spec is `PRD.md`; this file is only the gaps.

## 1. Known problems

### Research (Node 2)

| Problem | Why it is so | What it costs the investor |
|---|---|---|
| Few met or missed verdicts. Across the 22 frozen companies FINN found 1,025 commitments in 188 documents; the brief weighs up to 26 per company, and 10 got a verdict (8 met, 2 missed), on 5 companies. | By design, a verdict is arithmetic on six kinds of row in screener's tables (sales, operating margin, profit, ROCE, borrowings, working-capital days). Guidance that is long-range, about one segment, or about capex or volumes has no row to test it, so it stays open. Earlier versions let the model judge; they gave more verdicts and several were wrong. | "Promised vs delivered" is thin on most companies. It is right when it speaks, and quiet most of the time. |
| A company outside the 22 frozen ones is read live by a low-cost model. | Cost: DeepSeek flash does every read. A stronger model was tested on 14 Nov and was 4 to 130 times slower with no better output on these jobs, but nothing above it has been tried on the hardest job, mapping a commitment to the right table row. | First read takes 44 to 77 seconds. Commitments can be missed, and labels are sometimes loose. The page says so. |
| Frozen reads age. | The 22 files in `data/` were written on 14 Nov by hand-run commands. Nothing rewrites them. | When a company reports a new quarter or posts a new transcript, FINN notices, reads the new document live and rebuilds the brief, so nothing stale is shown; but that company loses its instant open until it is frozen again. |
| Page search is keyword scoring with a short list of finance synonyms. | No embeddings, to keep the build small. | A question worded differently from the document can miss a page that answers it. Known miss: auditors' fees on DIXON. |
| Only text PDFs are read. | No OCR. | A scanned transcript or report shows as "could not be read". |
| Long documents are cut. | 900 pages per document and 6,000 characters per page are stored. | The tail of a very long report cannot be cited. |
| Verdicts repeat, and a joined promise is half-tested. | The model is told to map a repeated commitment once and does not always do so: TCS's 26 to 28% margin band shows as three "met" rows. A label that joins two promises ("revenue growth 18 to 22%, EBITDA 21%+") is tested on the first only. | The count of verdicts overstates what was checked. Each row is still true as far as it goes. |
| Some documents fail to download. | Document links are whatever screener.in lists. Three faults were found and fixed on 14 Nov: BSE sends a header line Node's fetch rejects (a tolerant download is the fallback); a viewer page wrapping the PDF (unwrapped); and Maruti's old storage address, which now belongs to another site (rewritten to the new host, hardcoded for that one company). After the fixes all 188 documents of the 22 companies were read. Other companies will have other faults. | A missing transcript means missing commitments from that quarter. The Documents tab shows which. |
| A company with no transcripts on screener has a thin page. | TRENT lists none, so only its annual report is read. | No "last call" or "what analysts pressed on", and few commitments. |
| Only the latest annual report is read. | One report per company keeps the first read under a minute or so. | A promise made in last year's report is not picked up from the report itself, only from the calls. |
| A question asked from an alert does not know about the alert. | The ask bar on an alert hands the question to the research page, which answers from the annual report and transcripts. The filing that raised the alert is not among the documents it reads. | "Why did they change the CFO?" asked from a management-change alert gets "not in the documents" unless a transcript covers it. |
| The ask route has no rate limit. | Single demo user. | Each new question costs a model call; a shared link could be abused. |

### Feed and alerts (Node 1)

| Problem | Why it is so | What it costs the investor |
|---|---|---|
| Cards are built on every cold load, not stored. | No database yet; responses are cached 15 minutes. | A cold home screen makes two requests per holding (36 for the demo portfolio) and takes a few seconds. No history beyond 30 days. |
| Classification is keyword rules only. | The cheap model for filings the rules cannot place is not wired. | An unusual filing the rules do not recognise is hidden as routine. It is still listed under Hidden. |
| "Why it matters" is written from the exchange's one-line summary and the computed figures. | The filing PDF itself is not read on the push side. | The reasoning is only as specific as the summary line. |
| Management-change cards have no background of the incoming person. | Needs the filing PDF read by a model. | The brief asked for this; it is missing. |
| Results figures appear only when screener's table already has the quarter. | Figures come from screener's table, never from a model reading the filing. | For some hours after a result, the card says the figures are not in the table yet. |
| Rules are number inputs for the whole portfolio. | The sentence input ("for IEX use 3%") and per-stock rules were specified and not built. | One threshold fits a utility and a newly listed EV maker equally badly. |
| An alert page can return "not found" on a cold start. | Seen once on 14 Nov on a local production build; it loaded on the next request. Cause not found. The likely one: the alert is looked up in the feed, and the feed for that holding did not load on the first request. | A tap on an alert right after a deploy may need a second try. |
| "New since last visit" lives in the browser. | No accounts. | It resets on another device. |

### Platform

- One demo user. Portfolio and rules live in cookies.
- Every source is scraped (NSE, screener.in, Yahoo Finance, BSE's archive). Any of them can change its page or refuse cloud servers. Only documents have a fallback (the frozen reads); figures and the feed do not.
- "EBITDA" is screener's operating profit, which leaves out other income.
- Prices are end of day. There is no intraday view, by choice.
- The visual design is the first one ("ledger"). The planned "liquid" revamp has not been done.

## 2. What comes next, in order

1. **Re-freeze on a schedule.** A daily job that re-reads any company whose quarter or document list has changed, writing to hosted storage instead of files in the repository. Same job stores alert cards, which also removes the 36-request cold load (PRD 4.5).
2. **Read the filing on the push side.** The results PDF, the management-change PDF with the incoming person's background, and the rating rationale. Then hand the alert and its filing to the ask agent, so a question asked from an alert is answered from the filing first.
3. **More verdicts without letting a model judge.** Take segment revenue, capex and volumes from the annual report's own tables, with the page cited, so a commitment about a segment has a row to be checked against. The comparison stays arithmetic.
4. **A stronger model only for row mapping.** Mapping a commitment to the right row and period is the one job where reasoning quality decides the outcome. It runs once per company per quarter, so a better model there costs little.
5. **Embeddings for page search**, keeping keyword scoring as the fallback.
6. **Rules as sentences, per stock**, with the "would have fired N times" count beside each.
7. **Thesis notes** (PRD section 7, item 7): one line per holding on why it is owned, so "why it matters" is judged against the investor's own reason.
8. **Accounts, a rate limit on questions, and OCR for scanned documents.**
