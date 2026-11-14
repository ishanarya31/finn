# FINN — Product Requirements

Version 0.12 · 14 Nov 2026 · submission due 15 Nov 2026

Sections 1–5 and 8 reflect decisions the user has confirmed. Section 7 lists suggestions with their status; section 10 lists what is still open.

---

## 1. Problem

An investor is flooded with prices, filings, announcements and results. Most of it does not matter. The hard part is filtering: finding the few things that matter and hiding the rest. FINN should become something an investor opens through the day because it saves time and shows only what is important.

## 2. Who it is for

A professional, long-term fundamental investor: an analyst or portfolio manager at a private investment firm like ENAM, holding 15–20 companies for years on high conviction.

This person does not react to every price tick. For each holding they carry a reason for owning it, and what they need to know each day is whether anything has changed that reason.

They come to FINN with four questions:

| # | Question | When | Time they will give it |
|---|---|---|---|
| Q1 | Did anything happen in my holdings that I need to know about? | Start and end of day | 2–5 minutes |
| Q2 | This just happened to one of my stocks. What is it, and does it matter? | When an alert arrives | 1–2 minutes |
| Q3 | I am looking at a company I do not own. What is it, and is it any good? | When researching a new idea | 15–20 minutes |
| Q4 | I have a specific question about this company. What do its own documents say? | During research | Seconds per question |

Node 1 answers Q1 and Q2. Node 2 answers Q3 and Q4.

## 3. Goals and non-goals

**Goals**

- Answer the four questions above faster than the investor could alone
- Show a clear point of view on how an investor should work with such a tool
- Run reliably on a phone browser from a single link
- Spend as little as possible on models

**Non-goals**

- Buy or sell recommendations; FINN says why something matters and what to check next, and the investor decides
- Notifications outside the app (phone, email, messaging) and a separate alert inbox; alerts appear on the app screen only
- Portfolio profit-and-loss tracking, order placement, live intraday prices
- News, broker research, social media
- User accounts and login; there is one demo user

## 4. Node 1 — Push

**Purpose:** tell the investor what changed in their portfolio without being asked, and let them go one level deeper on any item.

**How alerts appear:** on the dashboard itself, when the user opens the app. When a threshold is crossed or a material filing arrives, it shows up as an alert on the screen. There are no phone notifications, emails or messages, and no separate inbox.

**Flow:** dashboard → tap an alert → alert detail → (optional) open the company page in Node 2.

### 4.1 Requirements taken from the brief

- A digest of filings and announcements across the portfolio for a chosen time window; default last 24 hours
- Items filtered and ranked, with routine items collapsed or hidden
- Alerts when a material announcement of a chosen type arrives
- Alerts on unusual end-of-day moves, with thresholds the user sets (for example volume above 2× the recent average, price beyond ±X%)
- Quarterly results presented as Revenue, EBITDA, PBT and PAT against the previous quarter and the same quarter last year
- Management changes presented with a short background of the incoming person

### 4.2 Candidate elements

Each will be specified one at a time using the template in section 6. This list is a starting point for that discussion, not an agreed design.

| # | Element | Investor question it answers |
|---|---|---|
| 1.1 | Headline count: how many things need attention, how many were hidden | Q1: how much of my time does today need? |
| 1.2 | Time-window picker | Q1: what did I miss since I last looked? |
| 1.3 | Alert list, ranked by importance | Q1: what should I read first? |
| 1.4 | Portfolio overview: every holding with its state today (alert, minor update, quiet) | Q1: is everything else really fine? |
| 1.5 | Minor updates, one line each | Q1: what is worth knowing but not acting on? |
| 1.6 | Hidden routine filings, viewable on demand | Trust: what did FINN decide I did not need? |
| 1.7 | Alert settings: thresholds and announcement types | Control: I decide what counts as unusual |
| 1.8 | Alert detail: what happened | Q2: the facts, with the numbers |
| 1.9 | Alert detail: why it matters | Q2: does this change my view of the company? |
| 1.10 | Alert detail: what to check next | Q2: what should I do with the next ten minutes? |
| 1.11 | Alert detail: source filing link | Trust: let me read the original |

### 4.3 Home screen layout (confirmed)

Option A, "Ranked feed", from `wireframes.md`. From top to bottom: a count line (need you · minor · hidden), the time-window picker with a "new since last visit" count, alert cards, minor updates as one line each, then quiet holdings and hidden filings collapsed to one line each. Search (to Node 2) and Rules sit in the top bar.

### 4.4 Alert rules (confirmed)

The brief requires that the user decides what "unusual" means, so rules stay in. The scope is kept to three things the user can set:

| Rule | Default | Notes |
|---|---|---|
| Price move in one day | beyond ±5% | |
| Volume against the 20-day average | above 2× | The 20-day period is fixed |
| Announcement types that raise an alert | results, M&A, management change, litigation, credit rating, pledging, fund raise | Chosen from the 17 categories in the appendix |

A rule applies to the whole portfolio unless it names specific stocks.

**How rules are set: a sentence, backed by a visible list.**

- The user types what they want watched, for example "tell me when anything falls more than 4%" or "for IEX use 3%".
- A cheap model turns the sentence into a structured rule. It does this once, when the rule is created.
- FINN shows the rule it understood and the user confirms it. A misread rule is caught here instead of failing silently later.
- All active rules are listed on the Rules screen. Each can be edited by tapping its number, or deleted.
- Next to each rule: how many times it would have fired in the last 30 days, so the user can judge whether the setting is too loose or too tight.
- If the user asks for something FINN cannot watch, it says so and lists what it can.

The daily check of rules against prices is plain arithmetic. No model is involved in deciding whether a rule fired.

Build order: defaults and plain number inputs first; the sentence input is added on top, since both write the same rule format.

### 4.5 How alert cards are produced (confirmed)

There is no single summarising agent. Each filing goes through fixed steps when it is fetched, and the finished card is stored. Opening the home screen only reads stored cards; no model runs at that moment.

1. **Group.** Several filings about one event (notice, outcome, newspaper advertisement, presentation) become one item. An unusual price or volume move on the same day as a filing is attached to that filing's card instead of making a second card.
2. **Classify** into one of the 17 categories: keyword rules first, a cheap model only for what the rules cannot place.
3. **Rank** into alert, minor or hidden, using the category and the user's rules.
4. **Fill the card.** Each type has its own fixed set of fields:

| Type | Fields | Who fills them |
|---|---|---|
| Results | Revenue, EBITDA, PBT, PAT; change on previous quarter and on the year-ago quarter | Cheap model reads the table from the filing into fixed fields; the changes are calculated |
| Management change | Who, role, date, successor, three-line background | Cheap model extracts from the filing |
| Unusual move | Price change, volume multiple, linked filing if any | No model |
| Other alert or minor item | One line, 15 words at most | Cheap model |
| Hidden | Title and link only | No model |

5. **Write the detail** ("why it matters" and "what to check next") with the reasoning model, for alert-level items only. This is a handful of items a day.

### 4.6 First draft as built (14 Nov) — awaiting confirmation

Built on live data at the user's request ("go ahead with the first draft"). Each row is a proposal until the user confirms it. Screens: `/` (home), `/alert/[id]` (detail), `/rules`.

| # | Element | Shows | Data | Model use | Interaction | Priority | Status |
|---|---|---|---|---|---|---|---|
| 1.1 | Headline count | "N need you", then minor, hidden and quiet counts, and a bar showing shown against filtered out | Counts of ranked items in the window | None | None | Must | Built |
| 1.2 | Time-window picker | 24h, 3d, 7d, Custom (a date, up to 30 days back); "N new" since the last visit, shown from the second visit on | Last visit kept in the browser; a visit ends after 30 minutes away | None | Tap to switch window | Must | Built |
| 1.3 | Alert list | Cards ranked by type (results, management, M&A, litigation, rating, pledging, fund raise, move), newest first within a type | NSE feed, grouped per event; screener.in table for results; Yahoo for moves | None on the card | Tap opens detail | Must | Built |
| 1.4 | Portfolio overview | "Quiet" line; opens to each quiet holding with its last session's change | Yahoo end-of-day | None | Tap to expand | Should | Built, as a collapsed line |
| 1.5 | Minor updates | One line each, four shown, rest behind "+ N more" | NSE feed text with the exchange's lead-in stripped | None yet | Tap opens the filing PDF | Must | Built |
| 1.6 | Hidden filings | Count; opens to title, time and link | NSE feed | None | Tap to expand; tap a row for the PDF | Must | Built |
| 1.7 | Alert settings | Price %, volume multiple, 17 announcement types; each threshold shows live how often it would have fired in 30 days; each type shows its 30-day count | Same 30 days of prices and filings | None | Edit, save, reset | Must | Built with number inputs; sentence input and per-stock rules not built |
| 1.8 | Detail: what happened | Filing text, results table, move figures, and a closing-price chart with price and date axes, a range toggle (1M, 3M, 1Y, 5Y, Max), a readout under the finger, and the event day marked | As above | None | None | Must | Built |
| 1.9 | Detail: why it matters | A short paragraph, then computed observations (margin now against last quarter and last year; how often this stock crosses the thresholds; first close after the filing) | Facts on the card only | DeepSeek, once per alert, cached 7 days; told to use only the supplied facts and give no buy/sell view. Falls back to a fixed note per type, labelled, if the model fails | None | Must | Built |
| 1.10 | Detail: what to check next | Two or three numbered checks | Same call as 1.9 | DeepSeek | None | Must | Built |
| 1.11 | Detail: sources | Every filing in the event with time, size and link; screener table; price source | NSE, screener.in, Yahoo | None | Tap opens the original | Must | Built |

**Differences from sections 4.4 and 4.5, to settle:**

- Cards are not stored. They are built on request from the three sources, with responses cached for 15 minutes (screener for 6 hours). No database exists yet. This keeps the demo running without a fetch job, but every cold load makes 36 requests.
- Classification uses keyword rules only. Filings the rules cannot place are hidden as routine; the cheap model for those (4.5 step 2) is not wired.
- Results figures come from screener.in's quarterly table, not from a model reading the filing. They appear only when screener's latest quarter is the one the filing reports. Lenders show Revenue, PBT and PAT; EBITDA is dropped.
- The management-change card shows the exchange's summary line. The three-line background of the incoming person is not built; it needs the filing PDF read by a model.
- The reasoning model sees the exchange's summary and the computed figures, not the full filing PDF.
- "EBITDA" is screener's Operating Profit, which excludes other income.
- The alert detail ends with a link to the company's research page (the Node 1 to Node 2 link).

## 5. Node 2 — Pull

**Purpose:** let the investor research any NSE-listed company from its own documents, and ask questions about it.

**Flow:** search a company → company page → ask the agent.

### 5.1 Requirements taken from the brief

- Works on any NSE ticker where data exists, not only the demo companies
- Grounded only in primary sources: annual reports and concall transcripts
- No news, broker notes, or the model's own knowledge of the company
- The brief lists eight possible outputs as a menu: business snapshot, financial snapshot, trajectory, balance sheet, cash quality, narrative vs. numbers, guidance, bull vs. bear
- The brief singles out narrative vs. numbers (what management promised against what was delivered over four quarters) as what it values most

### 5.2 Candidate elements

| # | Element | Investor question it answers |
|---|---|---|
| 2.1 | Search by company name or ticker | Q3: take me to the company |
| 2.2 | Company header: name, sector, size, price | Q3: what am I looking at? |
| 2.3 | Research sections chosen from the brief's menu of eight | Q3: what is this business and how is it doing? |
| 2.4 | Promised vs. delivered (narrative vs. numbers) | Q3: can I believe this management? |
| 2.5 | Ask-the-agent box with suggested questions | Q4: I have my own question |
| 2.6 | Agent answer with sources (document and page) | Trust: where does this come from? |
| 2.7 | Loading state for a company seen for the first time | Trust: what is FINN reading right now? |
| 2.8 | Message when a company has no documents available | Honesty over a made-up answer |

### 5.3 Node 2 as built (14 Nov)

Layout: Option D in `wireframes.md`, confirmed by the user. Screens: `/search`, `/company/[symbol]`, and `/portfolio` (section 5.4).

| # | Element | As built | Model use |
|---|---|---|---|
| 2.1 | Search | Type-ahead by name or ticker through screener.in's search; Enter opens the top match. Below it: "Read and ready" (DIXON, DMART, IEX, KPITTECH) and the user's portfolio as one-tap chips | None |
| 2.2 | Company header | Ticker, name, industry, price, market cap, P/E, from the screener.in page | None |
| 2.3 | Research sections | Brief tab: promised vs delivered, the business in three lines, risks as the company states them. Numbers tab: five quarters of Revenue, EBITDA, margin, PBT, PAT, and the price chart | DeepSeek for the business lines and risks, from the annual report pages; none for Numbers |
| 2.4 | Promised vs delivered | One row per commitment: status (met, missed, too early, open), the commitment, the outcome. Opens to the exact quote with document and page, and the figure from the tables | Bulk model finds commitments in each transcript; DeepSeek finds them in the annual report and maps each to a table row. The verdict itself is arithmetic |
| 2.5 | Ask bar | Floats over every tab; sending a question switches to the Ask tab; each tab keeps its scroll position. Four suggested questions before the first one | None |
| 2.6 | Answer with sources | Up to 90 words, a numbered source after each sentence, each source with document, page, link and a verbatim quote, then "Not in the documents" | DeepSeek, over the eight best-matching pages and the tables |
| 2.7 | First read | Documents are read in the background, in parallel, while Numbers is already on screen. Brief shows "Reading 3 of 5 documents"; the Documents tab lists each one with pages read and commitments found | As 2.3 and 2.4 |
| 2.8 | No documents | A message saying FINN will not guess, pointing to the Numbers tab | None |

**How it stays grounded**

- A quote is kept only if its words are found in the text of the page; the page number is taken from where the words were found, not from what the model said. Quotes that cannot be found are dropped.
- No model decides "met" or "missed". DeepSeek only maps a commitment to a row and period of screener's tables and states the promised numbers; code reads the cell and compares. Met means the company delivered at least what it promised: a range is a floor where higher is better (sales, margin, profit) and a ceiling where lower is better (borrowings, working-capital days).
- The mapping is then checked by rule. Only six kinds of row are used (sales, operating margin, profit, ROCE, borrowings, working-capital days), and only when the commitment's label opens with that measure; "Telecom revenue" or "FY26 capex" is never checked against company sales. A full-year commitment is checked only on that year's column. A figure dated before the commitment was made is not an outcome. Anything that fails a rule shows as open or too early.
- An answer with no valid source is not shown.
- Figures in the Numbers tab and on results cards come from screener's tables; the margin row is arithmetic on them.

**Annual reports.** The report is downloaded and its text extracted once (a 527-page, 21 MB report took about 5 seconds to extract). The bulk model is given the first words of every page and returns the page ranges of the business overview, management discussion and risk sections; if that fails, headings are matched by rule. DeepSeek reads those pages, up to 36. Only those pages are kept and cached, so questions about other parts of the report (the financial statements, governance) are not answerable.

**Caching.** Each document's reading is cached for 60 days, verdicts for 30, answers for 7, in Next's data cache. There is still no database.

**Known limits**

- A first read of a company takes about 35 to 40 seconds (it was 50 to 85 before the model change). A new question takes about 2 seconds; a repeated one is instant.
- Page matching for questions is keyword scoring with a few finance synonyms, not embeddings.
- The ask route has no rate limit.
- Verdicts are sparse. Across the five companies read in testing (POLYCAB, DIXON, IEX, KPITTECH, DMART), 2 of 30 commitments got a met or missed verdict; the rest were too early or open, because most guidance is long-range, about one segment, or about something screener's tables do not carry (capex, volumes). Earlier versions that let the model judge produced more verdicts, and several were wrong.
- Closed 14 Nov by frozen reads (section 5.5): the 22 demo companies no longer need a first read on the deployed site.

### 5.3a Whole-document coverage and a fuller Brief (14 Nov, plan approved by the user)

- **Page store.** Every page of every document is stored in Next's data cache, 150 pages to a part, so a question can be answered from any page. Before this only 36 annual-report pages were kept. No database was added.
- **Documents read:** the last eight concall transcripts (was four) and the latest annual report. The older four matter because a promise made a year ago is the one whose outcome has been reported.
- **Brief tab, top to bottom:** snapshot tiles (sales, profit, margin, ROCE, borrowings and debt to equity, cash conversion cycle, cash from operations as a share of profit, free cash flow); five fiscal years side by side; promised vs delivered; guidance on record (up to 10 quoted commitments); the last call in management's words (four points); what analysts pressed on (three points); the business; risks. Tiles and the five-year table are arithmetic on screener's tables and show with the page.
- **The Brief fills in stages:** figures at once, transcript-based blocks when the transcripts are read, annual-report blocks when the report is read.
- **Suggested questions** are answered in the background once the brief has loaded, so a tap shows the answer at once.
- **Rule for the code:** a cached function never calls another cached function; Next runs the inner one again in full. That was the cause of every question re-reading every document.

Measured locally on 14 Nov: figures under 1 s; transcript-based brief 7 to 13 s; full first read 44 to 77 s across five companies, most of it downloading the annual report; new question about 2.5 s; repeated question under 0.1 s. Across the five companies, 3 of 53 commitments got a met or missed verdict.

### 5.4 Portfolio page (14 Nov, requested by the user)

`/portfolio` lists the user's companies by ticker and name, nothing else. Tapping one opens its company page. A company is added through the same search and removed with one tap; at most 25. Node 1 (feed, alerts, rules) watches exactly this list. The list is kept in a cookie, since there is one demo user and no login; with no cookie it is the 18 demo companies in section 8.3. Adding checks that the ticker has NSE price history.

### 5.5 Changes requested 14 Nov (evening), from `changes to be done.txt`

Requested by the user as a list; recorded here before building. The "liquid look" revamp on that list is deferred until these are done.

| # | Element | Shows | Answers | Data | Model use | Interaction | Priority |
|---|---|---|---|---|---|---|---|
| 1.12 | Ask bar on the alert detail | The same floating bar as the company page, reading "Ask Finn about TICKER" | Q4, reached from Q2: I have a question about the company behind this alert | None on the alert page | None on the alert page; the answer is Node 2's (2.6) | Sending opens `/company/TICKER?ask=…`, which lands on the Ask tab with the question already asked | Must |
| 1.13 | Pointer from an empty window (confirmed by the user, 14 Nov) | When the chosen window has no alert: one line under "Nothing needs you" giving the count in the nearest wider window that has any, for example "5 alerts in the last 3 days" | Q1: is it really quiet, or is it a weekend? | The same ranked items, counted over 3 and 7 days | None | Tap switches to that window. The default stays 24 hours, as the brief requires | Must |
| 2.2 | One company header for both nodes | Ticker, name and industry, then price, market cap and P/E. On an alert, the alert type and time sit under it | Q2 and Q3: what am I looking at? | screener.in page, cached 6 hours | None | None | Must |
| 2.5 | Ask bar wording | "Ask Finn about TICKER", then "Ask Finn a follow-up" | Q4 | – | None | As before | Must |
| 2.9 | Frozen reads | The 18 demo-portfolio companies and the 4 research demos open with documents, brief and the four suggested answers already there | Q3 without the first-read wait; a demo that runs | `data/TICKER.json.gz`, written by the same pipeline on the development machine and shipped with the app | The same calls as 2.3 to 2.6, made once ahead of time | None; the Documents tab says when the read was done | Must |
| 2.10 | First-read note | On a company that was not read ahead: a line saying it is being read live by a low-cost model and that few verdicts should be expected | Honesty: why is this page thinner than the demo ones? | Whether a frozen read exists | None | None | Must |
| 3.1 | Maker's mark | Built, then removed the same evening at the user's request ("remove the watermarks please I dont like them"). Nothing is shown | – | – | – | – | Dropped |

**Frozen reads, how they work**

- A frozen read is the pipeline's own output saved to a file: every page of every document (the page is the chunk that questions search), the commitments, the last-call points, the business and risk lines, the brief with its verdicts, and the answers to the four suggested questions. Nothing in it is written by hand, and every quote in it passed the same page check as a live read.
- Lookup order: frozen file, then Next's data cache, then a live read. A document that appears after the freeze (a new transcript) is read live and the rest still comes from the file.
- The frozen brief and answers are used only while the latest reported quarter and the document list are the ones they were built from. When either changes they are rebuilt live from the frozen pages.
- Figures (header, tiles, tables) are never frozen; they are read from screener.in as before.
- The files are written by `POST /api/freeze/TICKER`, which answers only on a development machine.
- As frozen on 14 Nov: 22 companies, 188 documents, 12,398 pages, 1,025 commitments found, 11.7 MB of files. Verdicts: 8 met and 2 missed, on 5 companies. 87 of the 88 suggested answers have a sourced answer. TRENT has only its annual report; screener lists no transcripts for it. `npm run check` confirms that every frozen quote is found on the page it cites.
- Getting all 188 documents needed three fixes to downloading, which also apply to live reads: a tolerant fallback for a header line BSE sends that Node's fetch rejects; unwrapping a viewer page to the PDF behind it; and a rewrite of Maruti's old storage address, which now belongs to another site.
- Alignment fixes made with this change: the ask bar now sits on the page gutter; the last nav item and the last chart range meet the right edge; snapshot figures in a pair share a baseline when one label wraps.
- Suggestion 4 said the agent should know about the alert. It still does not: a question asked from an alert is answered from the annual report and transcripts, not from the filing that raised the alert. Recorded in `Future.md`.

**On the first-read note.** The user's wording was that verdicts are limited "since our models are cheap". That is half the cause. The other half is deliberate: a verdict is arithmetic on six kinds of table row, so anything long-range, segmental or not in screener's tables stays open whatever model reads it (section 5.3, known limits). The note says both.

**Confirmed by the user, 14 Nov:** nothing is hardcoded by hand; frozen reads are the pipeline's own output. The architecture and backend are considered done. What remains is the visual revamp and deployment.

### 5.6 Visual revamp: design option C2, "Magnitude" (15 Nov, confirmed by the user: "c2 looks good lets go ahead with it")

The design is `design/options/c2.html`, generated by `build_c2.py`. It changes how things look and where they sit. It changes no data and no model use.

| Area | As designed in C2 | How it is built in the app |
|---|---|---|
| Look | Dark navy ground, frosted glass panes, one orange-red signal colour. Hanken Grotesk for text, Azeret Mono for figures | `app/globals.css` rewritten; fonts through `next/font` |
| Top bar | Clear glass pill fixed at the top: FINN mark, company search, nav with a sliding thumb. Edge refraction in Chromium only. Phone: mark only, nav moves to a bottom tab bar | `app/shell.tsx`. The search box is a link: one click opens the Search page, whose box is focused (requested 15 Nov). Edge refraction dropped: it froze Chrome for about a second at a time while content scrolled |
| Feed, desktop | Two panes. Left: the count card fixed at the top (count, minor / hidden / quiet line, one chip per alert type, window picker), with the lists scrolling under it. Right: the open alert's detail scrolls in its own pane, with the ask bar fixed at its foot. The page itself does not scroll | `/` with `?a=<alert id>`. The first alert opens by default. The detail streams in, so the list never waits on the reasoning model |
| Feed, phone | The page scrolls. Tapping an alert opens its detail as a full-screen sheet with a back button | Same route: the sheet shows only when `?a=` is set |
| Alert cards | Size of the dot shows weight (results, then filings, then moves); one key line (results figures or the move); a footer line | Same facts as before. The results table moves from the card into the detail |
| Type chips | Tap a type to filter the list; "All" clears | Filtered in the browser |
| Keys | J / K move through alerts, / focuses search, Esc closes the sheet | Same |
| List edges | Fade only where there is more to scroll | Same |
| Other screens | Not drawn in C2 | Search, Company, Portfolio and Rules keep their layout and take C2's look: one glass pane, pill tabs and controls. On desktop the pane scrolls inside itself, so nothing passes under the top bar, and its top edge fades once scrolled. On a phone the page scrolls, with bands behind the top bar and the tab bar so text never shows through them |

`/alert/<id>` stays as an address and redirects to `/?a=<id>`, so old links still work.

## 6. Template for specifying an element

Every element gets one of these before it is built.

```
Element:        name
Shows:          what the user sees
Answers:        which investor question (Q1–Q4, trust, control)
Why it matters: what the investor loses without it
Data:           source and how often it updates
Model use:      none / bulk model / reasoning model, and for what
Interaction:    what tapping or changing it does
Priority:       must / should / could
```

## 7. Suggestions and challenges to the current idea

1. **Decide who the investor is first.** *Accepted.* The worry that "we don't know what an investor would want to see" goes away once the user is defined. The user is the grader's own profile (section 2), and every element is tested against the four questions.

2. **Replace "the best thing to do" with "why it matters and what to check next".** *Accepted.* A model telling a professional to buy or sell cannot be supported by filings, and one wrong call would undermine the whole app. FINN says what changed, what it means for the holding, and the two or three things to verify (for example "check whether margin guidance was repeated on the call"). No buy/sell call and no verdict.

3. **A dashboard can easily become the thing the brief warns against.** *Accepted (home screen Option A).* The brief says the scarce skill is filtering, not aggregating. A grid that gives all 18 holdings equal space is aggregation. The dashboard should be ranked by what changed, with quiet holdings shrunk to a small confirmation that nothing happened.

4. **Join the two nodes with one company page.** *Accepted, 14 Nov.* First declined on the belief that it led to the company's website; accepted once it was clear it opens FINN's own company page. Built as a link at the foot of the alert detail. The agent is not told about the alert. The alert detail should have a "dig deeper" link that opens the company page from Node 2, with the agent already aware of the alert. This means one page to build instead of two, and the app feels like one product.

5. **Do not make the pull page an empty chat box.** *Accepted, 14 Nov (Option D).* An empty box makes the user think of the right question. The page should open with a ready-made research view, with the agent alongside it and a few suggested questions. Every answer names its source.

6. **Give the web app a way to reach out (Telegram bot).** *Declined.* The user chose alerts on the app screen only, with no notifications and no inbox. Consequence to design for: since FINN cannot reach out, the dashboard must make it obvious at a glance what is new since the last visit.

7. **Optional, if time allows: thesis notes.** *Open.* Let the user write one line per holding on why they own it. FINN can then judge each alert against that line, which makes "why it matters" personal. This is a stretch item.

8. **Watch the clock.** Four days remain. Suggested split: today, finish the Node 1 element specs and UI; 12 Nov, build Node 1 on real data; 13 Nov, Node 2; 14 Nov, polish and deploy; 15 Nov, write-up and submit.

## 8. Platform and constraints

- Responsive web app, designed for a phone screen first; hosted on Vercel
- Framework: Next.js
- Models (decided 14 Nov after a side-by-side test, results in `llm-logs.md` A21): heavy lifting on DeepSeek flash with thinking off, with Gemini flash as the fallback if DeepSeek fails; reasoning prose (alert detail, annual-report reading) on DeepSeek flash with thinking on. Answers to questions use the fast call. OpenRouter is no longer used; `deepseek-v4-pro` is available through `DEEPSEEK_REASON_MODEL` but off, because it was 4 to 130 times slower with no better output
- Keys in `.env.local` (14 Nov): `DEEP_SEEK_KEY`, in use for alert detail; `OPEN_ROUTER_KEY`, not used yet. Both must also be added to the Vercel project before deploying
- Data: end-of-day prices and volumes (Yahoo Finance), exchange announcements (NSE/BSE), fundamentals and documents (screener.in)
- Portfolio: 18 NSE companies, listed in section 8.3; plus 4 companies for research demos. All 22 are read ahead of time and shipped as frozen reads (section 5.5)

### 8.1 Database and hosting

Vercel runs the web app but cannot run a Docker container, and it cannot reach a database on a laptop. The deployed app therefore needs a Postgres database that is hosted online (for example Neon, which Vercel offers as an add-on with a free tier).

A Docker Postgres on the laptop works for local development, because it is the same database software and the app only needs a different connection address. The cost is two databases to keep filled. The simpler setup is one hosted database used for both development and the deployed app. **Decided: hosted database only, no Docker.**

### 8.2 Data source test (11 Nov, from the development laptop)

| Data | Source | Result |
|---|---|---|
| End-of-day price and volume | Yahoo Finance | Works |
| Announcements | NSE announcements feed | Works. Returns date, category, a text summary and a PDF link for each filing; accepts a date range |
| Announcements | BSE announcements feed | Refused (403). Not needed, since NSE covers it |
| Filing PDFs | NSE archive | Works |
| Financial tables, document links | screener.in company page | Works. The page for the test company listed 35 transcripts and its annual reports |
| Concall transcript PDFs | BSE links from screener | Works. Text can be extracted |
| Annual report PDFs | BSE links from screener | Works, but large (the one tested was 14 MB) |

Open risk: these tests ran from a home connection. Exchange sites are known to refuse requests from cloud servers, so the same fetches must be tested from Vercel. If they are refused there, the daily fetch for the portfolio runs from the laptop and writes to the hosted database, which the deployed app reads.

**Update, 11 Nov (later):** a minimal Next.js app now exists in the project with a diagnostic route, `/api/fetch-test`, that requests every source above and reports the result. Run locally through the app's own server code, all six requests succeed. The app was then deployed to Vercel under the user's account (project `finn`, server functions pinned to the Mumbai region) and the same route was called three times: all six requests succeeded every time. The open risk above is therefore closed for now: Vercel's servers can reach every source, so both the daily portfolio fetch and live research on an unseen ticker can run on Vercel. This was a handful of requests on one day; heavier use could still meet rate limits, so fetched documents are cached and requests are kept few.

### 8.3 Demo portfolio (confirmed)

Chosen for a spread of sectors and sizes, and so that the feed shows many different alert types. The "seen recently" column comes from a scan of each company's NSE announcements and daily prices for 1 Oct – 11 Nov 2026. The scan matched keywords in NSE's own labels, so it is a rough guide.

| # | Ticker | Sector | Seen recently |
|---|---|---|---|
| 1 | RELIANCE | Energy / conglomerate | Credit rating, legal, press release |
| 2 | HDFCBANK | Bank | Management changes |
| 3 | INDUSINDBK | Bank | Management changes; 8 days of volume above 2× |
| 4 | BAJFINANCE | Lender | Fund raise, management change |
| 5 | TCS | IT services | Dividend, acquisition, press release |
| 6 | PERSISTENT | IT services (mid-size) | Credit rating, fund raise, press release; most filings of any scanned |
| 7 | BHARTIARTL | Telecom | Legal and regulatory |
| 8 | SUNPHARMA | Pharma | Press release, management change, credit rating |
| 9 | MARUTI | Autos | Press release, acquisition, legal |
| 10 | LT | Engineering / infrastructure | Order wins |
| 11 | ASIANPAINT | Consumer | Management change, dividend |
| 12 | VEDL | Metals | Dividend, credit rating |
| 13 | ADANIENT | Conglomerate | Acquisition, credit rating; 5 days of price moves beyond 5% |
| 14 | TATAPOWER | Utilities | Order wins, management changes |
| 15 | POLYCAB | Cables | Legal; 2 days beyond 5% |
| 16 | TRENT | Retail | Management changes, acquisition; 2 days beyond 5% |
| 17 | PAYTM | Fintech | Legal, acquisition; 2 days beyond 5% |
| 18 | OLAELEC | Electric vehicles | Fund raise; 8 days beyond 5%, 6 days of volume above 2× |

Research demos, outside the portfolio: DIXON, DMART, IEX, KPITTECH.

Notes:

- Three lenders are included (HDFCBANK, INDUSINDBK, BAJFINANCE). EBITDA is not a meaningful figure for a lender, so the results card needs a variant for them. This has to be handled anyway for the engine to work on any ticker.
- Every company reports second-quarter results by mid-November, so results alerts will appear for all of them.
- Not seen in the scan for any candidate: share pledging, bonus issue or split, capacity expansion. These types will be supported but may not appear in the live demo.

## 9. Submission

- Deployed link that works on a phone
- GitHub repository
- AI build history (`llm-logs.md` plus the raw transcripts)
- Short write-up in the covering email: what was built, decisions and trade-offs, what was left out, what comes next

## 10. Open questions

1. Closed 14 Nov: the alert detail links to the company page.
2. Closed 14 Nov: the company page opens on a ready-made brief, with the ask bar floating over it.
3. Suggestion 7: are thesis notes in or out?

4. Closed 14 Nov: Option D confirmed and built.
6. Closed 14 Nov: annual reports are read by section and cached. The four research-demo companies must be read once on the deployed site before the demo.
5. Section 4.6: confirm or change each element of the Node 1 first draft, and the listed differences from 4.4 and 4.5.

## 11. Decision record

| Date | Decision |
|---|---|
| 10 Nov | Drop Expo / React Native; build a responsive web app on Vercel |
| 11 Nov | Split the product into two nodes: Push and Pull |
| 11 Nov | Work node by node, element by element; design each node's UI fresh |
| 11 Nov | User is a professional, long-term fundamental investor |
| 11 Nov | Alert detail gives "why it matters + what to check next"; no buy/sell call |
| 11 Nov | Alerts appear on the app screen only; no notifications, no inbox |
| 11 Nov | Framework is Next.js |
| 11 Nov | Node 1's dashboard is the app's home screen; Node 2 is reached through search |
| 11 Nov | Build plain working UI for both nodes first; visual polish comes after |
| 11 Nov | Home screen layout is Option A, the ranked feed |
| 11 Nov | Alert rules as in section 4.4: three settings, set by sentence, shown in an editable list |
| 11 Nov | Alert cards produced by fixed steps per filing type (section 4.5), not by a single summarising agent |
| 11 Nov | Exchange announcements come from NSE's feed; BSE's feed refused requests in testing |
| 11 Nov | Database is hosted Postgres only; no Docker |
| 11 Nov | Demo portfolio of 18 companies accepted (section 8.3) |
| 11 Nov | All data fetching runs on Vercel (Mumbai region); the fetch test passed from there |
| 14 Nov | Product context recorded in `PRODUCT.md`; money is written in ₹ crore with Indian digit grouping |
| 14 Nov | Node 1 first draft built on live data (section 4.6); DeepSeek writes "why it matters" and "what to check next" from the card's facts only |
| 14 Nov | Bulk work uses both OpenCode and OpenRouter, run in parallel as two gatherers; DeepSeek reasons over what they return |
| 14 Nov | Alert detail chart has axes and a range toggle: 1M, 3M, 1Y, 5Y, Max. No 24-hour range: FINN has end-of-day prices only, and intraday prices are a non-goal |
| 14 Nov | Node 2 company page: header from Option A, tabs from Option B (Brief, Numbers, Documents, Ask), an ask bar that floats over every tab; asking switches to the Ask tab. Drafted as Option D, awaiting confirmation |
| 14 Nov | Annual reports are to be read in Node 2, not only transcripts |
| 14 Nov | No OpenCode key: bulk work runs on OpenRouter only, reasoning on DeepSeek |
| 14 Nov | Alert detail links to the company page (reverses the earlier "no dig deeper" decision) |
| 14 Nov | Option D confirmed for the company page; Node 2 built (section 5.3) |
| 14 Nov | Annual reports: bulk model finds the sections, DeepSeek reads them; every reading is cached |
| 14 Nov | Portfolio page added; the user edits the list and Node 1 watches only those companies (section 5.4) |
| 14 Nov | Models: DeepSeek flash for heavy lifting (Gemini flash as fallback) and for reasoning with thinking on; OpenRouter dropped; v4-pro not used |
| 14 Nov | Option B: every page stored in the cache and searched; no Postgres, Redis or embeddings |
| 14 Nov | Brief tab expanded to eight blocks; eight transcripts read; the Brief fills in stages |
| 14 Nov | An empty window points to the nearest wider window that has alerts; the default window stays 24 hours |
| 14 Nov | Section 5.5: ask bar on the alert detail, one header for both nodes, frozen reads for 22 companies, first-read note; a maker's mark was added and then removed at the user's request; problems and next steps kept in `Future.md`; the "liquid look" revamp comes after |
| 15 Nov | Design option C2 ("Magnitude") chosen for the visual revamp: dark glass, two-pane feed on desktop, alert sheet on phone (section 5.6) |
