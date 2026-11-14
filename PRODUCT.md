# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A professional, long-term fundamental investor: an analyst or portfolio manager at a private investment firm such as ENAM, holding 15–20 NSE/BSE companies for years on high conviction. They do not react to price ticks. For each holding they carry a reason for owning it, and each day they need to know whether anything changed that reason.

They arrive with four questions (full table in `PRD.md` section 2):

- Q1, start and end of day, 2–5 minutes: did anything happen in my holdings that I need to know about?
- Q2, when an alert appears, 1–2 minutes: what is this, and does it matter?
- Q3, researching a new idea, 15–20 minutes: what is this company, and is it any good?
- Q4, during research, seconds per question: what do the company's own documents say?

Second audience: the ENAM graders of the AI Engineer Build Challenge, who open one link on a phone. They share the primary user's profile.

## Product Purpose

FINN is a mobile-first investment agent with two nodes. **Push** is the home screen: a ranked feed of what changed across the user's portfolio, with a detail view per alert (what happened, why it matters, what to check next). **Pull** is research: search any NSE company, land on its page, and ask an agent questions answered from that company's own documents.

Success: the investor answers the four questions faster than they could alone, and opens FINN through the day because it shows only what matters.

## Positioning

Two promises of equal weight (confirmed 14 Nov):

1. **A filter, not an aggregator.** Filings and price moves are ranked into alert, minor or hidden by fixed rules and thresholds the user sets. What was hidden stays viewable, so the filter can be trusted.
2. **Primary sources only.** Research is grounded in annual reports, concall transcripts and company filings, with every model-written claim cited to document and page. No news, no broker notes, no reliance on the model's own knowledge of the company.

FINN never issues a buy or sell call. It says why something matters and what to check next; the investor decides.

## Operating Context

- Opened on a phone browser from a single link, several times a day. Also usable on desktop.
- Alerts exist only on the app screen. There are no notifications, emails, messages or inbox, so the home screen must make "new since last visit" obvious.
- One demo user, no login. Demo portfolio of 18 NSE companies plus 4 research demos (`PRD.md` section 8.3).
- Data: end-of-day prices and volumes (Yahoo Finance), announcements (NSE feed), financial tables and document links (screener.in), filing and transcript PDFs (NSE and BSE archives). No live intraday prices.
- Cards are produced when a filing is fetched and stored; opening the home screen runs no model.

## Capabilities and Constraints

- Stack: Next.js on Vercel (Mumbai region), hosted Postgres. API keys stay on the server.
- Models: DeepSeek for reasoning (alert detail, research answers); free bulk models for classification and extraction. Fetched documents are cached.
- Financial figures come from scraped tables and arithmetic, never from a model.
- **Money is written in ₹ crore with Indian digit grouping (₹1,23,456 cr); share prices in ₹** (confirmed 14 Nov).
- Results are shown as Revenue, EBITDA, PBT and PAT against the previous quarter and the year-ago quarter. Lenders need a variant, since EBITDA is not meaningful for them.
- Alert rules the user can set: one-day price move (default ±5%), volume against the 20-day average (default 2×), and which announcement types raise an alert. Rules are entered as a sentence, confirmed, and listed for editing.
- The digest window is chosen by the user; default last 24 hours.
- Research must work on any NSE ticker where documents exist. When none exist, FINN says so instead of answering.
- Terminology: Push, Pull, alert, minor update, hidden filing, quiet holding, rule, "why it matters", "what to check next", promised vs. delivered.
- Out of scope: buy/sell recommendations, profit-and-loss tracking, order placement, accounts, news and social media.
- Undecided (`PRD.md` section 10): whether an alert's "dig deeper" opens the Pull company page; whether the Pull page opens with a ready-made research view; whether thesis notes are in.

## Brand Commitments

The name **FINN** is fixed. No logo, colour, typeface or tagline exists yet (confirmed 14 Nov).

Voice, from the brief: concise and dense. Numbers before adjectives. No filler, no hype, no verdicts.

## Evidence on Hand

- `PRD.md`: the working spec and source of truth for what is built.
- `wireframes.md`: home screen layout options; Option A, the ranked feed, is confirmed.
- `ENAM_AI_Engineer_Build_Challenge_Main.pdf` and `ENAM_Build_Challenge_Reference.pdf`: the brief and its appendix, including the 17 announcement categories.
- `app/api/fetch-test`: a diagnostic route showing every data source is reachable from Vercel.
- Real data only: live NSE announcements, real filings, real prices for the demo portfolio.

Do not fabricate: users, testimonials, performance or accuracy claims, customer logos, or any financial figure. No finished product screens exist yet.

## Product Principles

1. **Filter, do not aggregate.** Surface the few things that matter and bury the rest. Equal space for every holding is aggregation.
2. **Show the source.** Every claim leads back to a document and page; every alert links to its filing.
3. **Inform, never advise.** Why it matters and what to check next. No verdicts.
4. **The user defines unusual.** Thresholds and alert types belong to the investor, and FINN shows what it understood.
5. **Thin and running beats broad and broken.** Density over decoration; a demo that fails is the worst outcome.
