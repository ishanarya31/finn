# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# FINN — project context

FINN is a mobile-first financial investment agent, built as a submission for the ENAM AI Engineer Build Challenge. **Deadline: 15 Nov 2026.** The brief is `ENAM_AI_Engineer_Build_Challenge_Main.pdf`; the appendix is `ENAM_Build_Challenge_Reference.pdf`. The working spec is `PRD.md`. Read `PRD.md` before proposing or building anything.

## Always do this

**Log every exchange.** After responding to each user prompt, append an entry to `llm-logs.md`: the prompt word for word, a short account of what you did, and any decision made. Follow the format already in that file (`### A<n> · <date> — <title>`, then **Prompt**, then **What Claude did**). The log is a graded deliverable.

## How we work

- **Element by element.** Take one UI element at a time. For each, agree on: what it shows, which investor question it answers, why that matters to the investor, where the data comes from, and its priority. Record it in `PRD.md` before building it.
- **No building ahead of the spec.** Do not implement an element that has not been agreed in `PRD.md`.
- **Question and suggest.** The user wants to be challenged. Say so when an idea conflicts with the brief or with what a professional investor would want, and offer a better option.
- Suggestions marked *Open* in `PRD.md` section 7 are Claude's recommendations that the user has not confirmed. Do not treat them as decided; raise them when the relevant element comes up.
- Do not reuse the earlier Figma Make code. The UI follows design option C2 (`design/options/c2.html`, PRD §5.6): dark glass, two-pane feed on desktop, alert sheet on phone. `PRODUCT.md` and `.impeccable/` belong to the Impeccable design skill.
- Never delete files with `rm` without asking; the user has rejected that before.
- `Future.md` is the honest list of known problems and next steps. Add to it rather than hiding a limitation.
- `changes to be done.txt` holds the user's raw change requests; `PRD.md` §5.5 is the agreed version.

## Commands

```
npm run dev      # local server on :3000
npm run build    # production build (what Vercel runs)
npm run check    # the only test: assert-based self-check of lib/ logic and every frozen file in data/
```

There is no lint or test framework. `lib/check.ts` is a single script; to test one thing, run it and read the assertion that fails.

Freeze a company (development only; the route returns 404 in production), with `npm run dev` running:

```
curl -X POST http://localhost:3000/api/freeze/TCS
```

Server env vars (in `.env.local`): `DEEP_SEEK_KEY`, `GEMINI_KEY`, `OPEN_ROUTER_KEY` (unused; free models were unreliable). Optional overrides: `DEEPSEEK_MODEL`, `DEEPSEEK_REASON_MODEL`, `GEMINI_MODEL`.

This folder is not a git repository. Deployment is Vercel, region `bom1` (`vercel.json`), so NSE and BSE can be reached from an Indian IP.

## Next.js version

Next 16 and React 19, TypeScript 7. APIs differ from older Next (for example, `params` and `searchParams` are Promises, and `cookies()` is async). Read the guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).

## Architecture

All logic lives in four files in `lib/`; `app/` is thin server components and route handlers.

- **`lib/finn.ts` — Node 1 (Push). No model runs here.** `getFeed()` fetches 30 days of NSE corporate announcements and 3 months of Yahoo daily prices for each holding (cached 15 min through `grab()`, which wraps `fetch` with `next.revalidate`). `classify()` sorts each filing into one of the 17 appendix categories using keyword rules. `buildItems()` groups filings into cards and gives each a tier (`alert` / `minor` / `hidden`). Price or volume moves past the user's rules (`fires()`) join a filing card from the same session, or become their own "Unusual move" card. Quarterly results are scraped from screener.in tables, and the changes are computed in code.
- **`lib/reason.ts`** writes the "why it matters / what to check next" text on an alert. It uses `think()` given only the facts on the card. Without a key it falls back to a fixed `PLAYBOOK` per category, labelled `by: "playbook"`.
- **`lib/research.ts` — Node 2 (Pull).** `getCompany()` scrapes screener.in for the name, ratios, tables and document links (concall transcripts and the latest annual report; consolidated first, then standalone). `readLive()` downloads PDFs (via `unpdf`, with a tolerant `https.get` fallback for BSE) and has the fast model pull out commitments. `getBrief()` builds "promised vs delivered". A verdict is arithmetic on a small set of table rows (`checkable`/`lookup`/`decide`), never a model judgement. `ask()` answers questions: keyword page ranking (`rankPages`), then the reasoning model, with numbered sources. Every quote is checked against its claimed page with `locate()`.
- **`lib/llm.ts`** has three call types, all returning JSON. `deepseek()` is fast, thinking off, and its output is acted on by code. `bulk()` is the same call with a Gemini fallback. `think()` has thinking on and writes prose an investor reads.

**Frozen reads (`data/<SYMBOL>.json.gz`).** These hold the pipeline's own output (document reads, brief, answers to the `SUGGEST` questions) for the 18 portfolio companies plus the 4 `DEMO` ones. Nothing in them is written by hand. Lookup order: the file, then Next's data cache, then a live read. A frozen brief is used only while its `stamp` (latest results period + document URL list) matches the live company. `next.config.mjs` uses `outputFileTracingIncludes` so these files ship with the serverless functions. `npm run check` checks that every quote in every file sits on its cited page.

**Per-user state without accounts.** Cookies: `finn_rules` (thresholds and categories) and `finn_pf` (portfolio). Both are parsed as untrusted input by `parseRules` / `parsePortfolio`. "New since last visit" uses `localStorage` (`app/seen.tsx`).

**Routes.** `/` is the feed. Its URL state is `?w=24h|3d|7d|custom&from=` (digest window), `t=` (alert-type chip) and `a=` (the open alert). On desktop the alert detail (`app/detail.tsx`, streamed in a Suspense boundary) fills the right pane, and the first alert opens by default. On a phone the detail is a full-screen sheet, shown only when `a=` is set. `/alert/[id]` only redirects to `/?a=`. `/company/[symbol]` is the research page; it calls `/api/research/[symbol]` (per document with `?doc=`, then the brief) and `/api/ask`. `/search` uses `/api/search` (screener search). `/portfolio` and `/rules` edit the cookies. `/api/prices` serves the chart ranges. `/api/fetch-test` checks whether the deployed server can reach each source.

**UI shell.** `app/shell.tsx` holds the client glass pieces: `TopBar`, `Seg` (sliding-thumb control) and `Fade` (scroll pane with faded edges, driven by `data-up` / `data-down`). `app/keys.tsx` handles J / K / Esc on the feed. Below 980px the nav becomes a bottom tab bar, so anything fixed or sticky at the bottom must sit above it. Do not put `backdrop-filter` on an ancestor of a `position: fixed` element (the ask bar, the phone sheet): it traps them. On desktop every screen except the feed scrolls inside `main` (the pane), not the window: use the pane for any scroll position (see `pane()` in `company.tsx`). Do not use `backdrop-filter: url(...)` (SVG filters): it froze Chrome for about a second per frame while content scrolled.

**Import quirk.** Files in `lib/` import each other with `.ts` extensions and import `next/cache.js`, so `lib/check.ts` can run under plain `node --experimental-strip-types`. Keep this when adding imports to `lib/`.

**`ponytail:` comments** mark deliberate shortcuts, each with its ceiling and how to upgrade. Read them before "fixing" something that looks too simple.

## The product

1. **Push**: a dashboard for the user's portfolio (15–20 NSE/BSE stocks). It shows only the key points of what changed. Opening an alert shows what happened, why it matters, and what to check next.
2. **Pull**: a research tool. The user searches any NSE stock, lands on its page, and asks an agent questions answered from the company's own documents.

## Decisions so far

| Topic | Decision |
|---|---|
| Platform / hosting / framework | Responsive web app, mobile-first; Vercel; Next.js |
| Reasoning model | DeepSeek flash, thinking on |
| Bulk models | DeepSeek flash, thinking off; Gemini flash as fallback |
| Target user | Professional long-term fundamental investor |
| Alert advice | "Why it matters + what to check next"; no buy or sell call |
| Alert delivery | On screen only: no notifications, no inbox |

## Rules from the brief that must not be broken

- Filter, do not aggregate: surface the few things that matter and bury the rest.
- Pull-side analysis uses primary sources only (annual reports, concall transcripts, company filings). No news, no broker notes, no reliance on the model's own knowledge of the company.
- Research must work on any NSE ticker, not only the demo set.
- Alert thresholds are set by the user (for example, volume above 2× the recent average, or a price move beyond ±X%).
- The user chooses the digest window; the default is the last 24 hours.
- A thin prototype that runs beats a broad one that breaks. A demo that does not run is the worst outcome.
- No AI slop: concise, dense, well presented, interactive.
- Cost matters: cheap models for bulk work, a strong model only where reasoning needs it, and cache what has been read.

## Engineering rules

- Financial figures come from scraped tables and arithmetic, never from a model.
- Every model-written claim on the pull side carries a source (document and page).
- Keep API keys on the server.
- Prefer the simplest thing that works.
