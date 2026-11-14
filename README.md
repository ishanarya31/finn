# FINN

A mobile-first investment agent for a long-term fundamental investor, built for the ENAM AI Engineer Build Challenge.

**Live:** https://finn-three-kappa.vercel.app (open it on a phone; it works on desktop too)

An investor holding 15–20 NSE companies is flooded with filings, price moves and results, and most of it does not matter. FINN filters instead of aggregating: it shows the few things that changed in your holdings, buries the rest where you can still check it, and answers questions about any company from that company's own documents.

## What it does

**Push: the feed.** The home screen watches your portfolio and shows only what crossed your rules.

- Every NSE filing for your holdings is sorted into one of the brief's 17 announcement types by keyword rules, then ranked as an alert, a minor update or hidden.
- Price and volume moves are checked against thresholds you set on the Rules page (default: a ±5% day, or volume 2× the 20-day average). A move joins the card of a filing from the same session; a move with no filing behind it gets its own card.
- Opening an alert shows what happened (filing text, the results table with quarter-on-quarter and year-on-year change, a price chart with the event day marked), why it matters, and what to check next. FINN never gives a buy or sell call.
- You pick the window: 24 hours (the default), 3 days, 7 days or a custom date. Hidden filings and quiet holdings stay one tap away, so the filter can be checked.

**Pull: research.** Search any NSE company and land on its page.

- **Brief:** promised vs delivered (management's commitments from concall transcripts, checked against the reported tables), guidance on record, what the last call said, what analysts pressed on, the business, and the risks as the company states them.
- **Numbers:** quarterly results, five years of figures and a price chart.
- **Documents:** the last eight concall transcripts and the latest annual report.
- **Ask Finn:** questions answered from every page of those documents, with each claim cited to document and page.

Analysis uses primary sources only: annual reports, concall transcripts and filings. No news, no broker notes, and no reliance on the model's own knowledge of the company.

## How it works

- **Figures come from scraped tables and arithmetic, never from a model.** Results and ratios are read from screener.in, and every change is computed in code. A "met" or "missed" verdict is arithmetic on a table row; a commitment the tables cannot test stays open rather than being guessed.
- **Every quote is checked.** Each quote a model returns is located on the page it cites before it is shown.
- **Cheap models for bulk work, a reasoning model only where it is needed.** DeepSeek flash with thinking off finds commitments and the relevant sections (Gemini flash is the fallback). DeepSeek flash with thinking on writes the prose an investor reads: why an alert matters, research answers.
- **Read once, cache everything.** Data-source responses and model outputs are cached. The 18 demo-portfolio companies and 4 research demos ship pre-read in `data/*.json.gz`, so they open at once. That is the pipeline's own output, not hand-written, and `npm run check` confirms every quote in it sits on its cited page. Any other company is read live on its first visit.
- **No cron, no database.** Each visit builds the feed from NSE announcements (last 30 days) and Yahoo Finance end-of-day prices, cached for 15 minutes. The windows count back from the moment of the visit.
- **No accounts.** Your portfolio and rules live in cookies.

Data sources: NSE (announcements), Yahoo Finance (end-of-day prices), screener.in (financial tables and document links), NSE and BSE archives (filing, transcript and annual-report PDFs). The app is deployed in Vercel's Mumbai region so that NSE and BSE answer.

## Run it locally

Requires Node.js 22.6 or newer.

```bash
git clone https://github.com/ishanarya31/finn.git
cd finn
npm install
```

Create `.env.local` in the project root:

```bash
DEEP_SEEK_KEY=...   # DeepSeek API key: alert reasoning, live research, answers
GEMINI_KEY=...      # optional: Gemini fallback for bulk work
```

Then run:

```bash
npm run dev     # http://localhost:3000
npm run check   # self-check: classification, thresholds, parsing, and every pre-read file's quotes
npm run build   # production build
```

Without `DEEP_SEEK_KEY` the app still runs: alerts show a fixed checklist per filing type, labelled as such, and the 22 pre-read companies keep their briefs and suggested answers until one reports a new quarter or posts a new transcript. Reading a new company live and asking new questions need the key. Optional overrides: `DEEPSEEK_MODEL`, `DEEPSEEK_REASON_MODEL`, `GEMINI_MODEL`.

To pre-read another company (development only), run this with the dev server up:

```bash
curl -X POST http://localhost:3000/api/freeze/TICKER
```

## Project layout

```
app/        Next.js pages and API routes (feed, alert detail, search, company, portfolio, rules)
lib/finn.ts      Push: fetch filings and prices, classify, group, rank. No model.
lib/research.ts  Pull: company page, PDF reading, brief, verdicts, answers with sources
lib/reason.ts    "Why it matters" and "what to check next" for an alert
lib/llm.ts       Model calls (DeepSeek, Gemini fallback); keys stay on the server
lib/check.ts     The self-check behind `npm run check`
data/       Pre-read companies
design/     Design options explored; C2 was chosen
```

## Documents

- [`PRD.md`](PRD.md): the spec; every element was agreed there before it was built
- [`llm-logs.md`](llm-logs.md): the full build history with the AI assistant, prompt by prompt
- [`Future.md`](Future.md): known problems and what would come next
- [`PRODUCT.md`](PRODUCT.md): users, positioning and product principles

Stack: Next.js 16, React 19, TypeScript, `unpdf` for PDF text. No other runtime dependencies.
