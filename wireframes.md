# Wireframes

Barebones layouts, phone width. Sample data is made up.

## Node 1 — Home screen

### Option A — Ranked feed

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ 3 need you · 6 minor · 40 hidden     │
│ [24h]  3d   7d   Custom        2 new │
├──────────────────────────────────────┤
│ ALERTS (3)                           │
│ ┌──────────────────────────────────┐ │
│ │ POLYCAB · Results            NEW │ │
│ │ Rev 6,420   QoQ +8%   YoY +19%   │ │
│ │ PAT   608   QoQ +5%   YoY +22%   │ │
│ │ Margins up, 2nd quarter running> │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ DIXON · Mgmt change          NEW │ │
│ │ CFO leaving 31 Dec. Successor:   │ │
│ │ 22 yrs finance, ex auto-parts  > │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ IEX · Unusual move               │ │
│ │ Price -6.2%    Volume 3.1x avg   │ │
│ │ No filing explains it          > │ │
│ └──────────────────────────────────┘ │
│                                      │
│ MINOR (6)                            │
│ TITAN    Dividend Rs 6, rec 21 Nov   │
│ INFY     Analyst meet 14 Nov         │
│ + 4 more                             │
├──────────────────────────────────────┤
│ QUIET   9 holdings, nothing material │
│ HIDDEN  40 routine filings         > │
└──────────────────────────────────────┘
```

### Option B — Status grid + list

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ 18 holdings · last 24h       [24h v] │
│                                      │
│ [POLY !] [DIXN !] [IEX  !] [TITN +]  │
│ [INFY +] [SUNP +] [LT   +] [ITC  +]  │
│ [TRNT +] [RELI .] [HDFC .] [ICIC .]  │
│ [BHRT .] [MRTI .] [PERS .] [CUMI .]  │
│ [CDSL .] [KPIT .]                    │
│ ! alert   + minor   . quiet          │
│ (tap tile -> filter list below)      │
├──────────────────────────────────────┤
│ ALERTS (3)                           │
│ ! POLYCAB  Results: PAT +22% YoY   > │
│ ! DIXON    CFO change              > │
│ ! IEX      -6.2% on 3.1x volume    > │
│                                      │
│ MINOR (6)                            │
│ + TITAN    Dividend Rs 6             │
│ + INFY     Analyst meet 14 Nov       │
│ + 4 more                             │
├──────────────────────────────────────┤
│ 40 routine filings hidden          > │
└──────────────────────────────────────┘
```

### Option C — Holdings table

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ Portfolio · last 24h         [24h v] │
│ 3 need you · 6 minor · 9 quiet       │
├──────────────────────────────────────┤
│ STOCK     DAY%   VOL   WHAT CHANGED  │
│ POLYCAB   +3.1   1.4x  Results    >  │
│ DIXON     -0.8   0.9x  CFO change >  │
│ IEX       -6.2   3.1x  Unusual mv >  │
│ TITAN     +0.2   1.0x  Dividend      │
│ INFY      -0.4   0.8x  Analyst mt    │
│ SUNPHARMA +1.1   1.2x  Press rel     │
│ + 3 more minor                       │
├──────────────────────────────────────┤
│ QUIET (9)                            │
│ RELIANCE  +0.3   0.9x  -             │
│ HDFCBANK  -0.1   1.1x  -             │
│ ICICIBANK +0.6   1.0x  -             │
│ + 6 more                             │
├──────────────────────────────────────┤
│ 40 routine filings hidden          > │
└──────────────────────────────────────┘
```

### Option D — Two streams (triggers / filings)

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ TRIGGERED · your rules               │
│ Price +/-5% · Volume 2x       [edit] │
│ ┌──────────────────────────────────┐ │
│ │ IEX                          NEW │ │
│ │ Price -6.2%    Volume 3.1x avg   │ │
│ │ No filing explains it          > │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ SUNPHARMA                        │ │
│ │ Volume 2.4x avg   Price +1.1%    │ │
│ │ Linked: press release today    > │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ FILINGS                [24h]  3d  7d │
│ 2 matter · 6 minor · 40 hidden       │
│ ┌──────────────────────────────────┐ │
│ │ POLYCAB · Results            NEW │ │
│ │ Rev 6,420   QoQ +8%   YoY +19%   │ │
│ │ PAT   608   QoQ +5%   YoY +22% > │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ DIXON · Mgmt change              │ │
│ │ CFO leaving. Successor: 22 yrs > │ │
│ └──────────────────────────────────┘ │
│ TITAN    Dividend Rs 6, rec 21 Nov   │
│ + 5 more minor                       │
│ 40 routine filings hidden          > │
└──────────────────────────────────────┘
```

## Node 2 — Pull (proposed 14 Nov, not yet chosen)

Phone width. Sample data is made up.

### Screen 1 — Search

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ dix|                             │ │
│ └──────────────────────────────────┘ │
│ DIXON     Dixon Technologies       > │
│ DIXCHEM   Dixon Chemicals          > │
│                                      │
│ YOUR HOLDINGS                        │
│ RELIANCE  HDFCBANK  TCS  LT   +14    │
│ RECENT                               │
│ IEX   KPITTECH                       │
└──────────────────────────────────────┘
```

### Screen 2, Option A — Brief first, ask bar docked (recommended)

```
┌──────────────────────────────────────┐
│ ‹ Search                             │
│ DIXON                                │
│ Dixon Technologies · Electronics     │
│ ₹14,820   M.cap ₹89,400 cr   P/E 72  │
├──────────────────────────────────────┤
│ PROMISED VS DELIVERED    last 4 qtrs │
│ 2 met · 1 missed · 2 too early       │
│ ┌──────────────────────────────────┐ │
│ │ MISSED                           │ │
│ │ Said "margin 4.0-4.5% in FY27"   │ │
│ │      Q4 FY26 call, p.6         ↗ │ │
│ │ Got  3.7%   Q2 FY27 table        │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ MET                              │ │
│ │ Said "revenue growth above 30%"  │ │
│ │      Q1 FY27 call, p.3         ↗ │ │
│ │ Got  +38% YoY   Q2 FY27 table    │ │
│ └──────────────────────────────────┘ │
│ + 3 more                             │
├──────────────────────────────────────┤
│ NUMBERS                 ₹ cr         │
│          Sep25 Dec25 Mar26 Jun26 Sep26│
│ Revenue  6,477 7,636 8,864 8,210 9,899│
│ EBITDA   1,021   966 1,161 1,136 1,422│
│ PAT        693   630   786   797   990│
│ [price chart   1M 3M 1Y 5Y Max]      │
├──────────────────────────────────────┤
│ READ  4 transcripts · 1 annual rpt > │
├──────────────────────────────────────┤
│ What did they guide on margins?      │
│ Why did working capital rise?        │
│ [Ask about DIXON...               ↑] │
└──────────────────────────────────────┘
```

### Screen 2, Option B — Tabs

```
┌──────────────────────────────────────┐
│ ‹ Search          DIXON   ₹14,820    │
│ [Brief]  Numbers   Documents   Ask   │
├──────────────────────────────────────┤
│ PROMISED VS DELIVERED                │
│ MISSED  margin 4.0-4.5%  ->  3.7%  > │
│ MET     rev growth >30%  ->  +38%  > │
│ EARLY   capex ₹1,200 cr in FY27    > │
│                                      │
│ BUSINESS IN THREE LINES              │
│ Contract maker of phones, TVs and    │
│ appliances for brands. [AR FY26 p.12]│
└──────────────────────────────────────┘
```

### Screen 2, Option C — Chat first

```
┌──────────────────────────────────────┐
│ ‹ Search          DIXON   ₹14,820    │
├──────────────────────────────────────┤
│                                      │
│   Ask anything about Dixon.          │
│   Answers come from its filings.     │
│                                      │
│ [Promised vs delivered]              │
│ [Business snapshot]  [Balance sheet] │
│ [Guidance]           [Bull vs bear]  │
│                                      │
│ [Ask about DIXON...               ↑] │
└──────────────────────────────────────┘
```

### Screen 3 — Answer with sources

```
┌──────────────────────────────────────┐
│ ‹ DIXON                              │
│ Q  What did they guide on margins?   │
├──────────────────────────────────────┤
│ Management guided to an operating    │
│ margin of 4.0-4.5% for FY27 [1] and  │
│ repeated it a quarter later [2].     │
│ Q2 FY27 came in at 3.7% [3].         │
│                                      │
│ SOURCES                              │
│ 1  Q4 FY26 concall, p.6            ↗ │
│    "we expect margins of 4 to 4.5"   │
│ 2  Q1 FY27 concall, p.4            ↗ │
│    "we maintain our margin guidance" │
│ 3  Quarterly table, screener.in    ↗ │
│                                      │
│ NOT IN THE DOCUMENTS                 │
│ Any guidance for FY28.               │
├──────────────────────────────────────┤
│ [Ask a follow-up...               ↑] │
└──────────────────────────────────────┘
```

### Screen 4 — First read of a company

```
┌──────────────────────────────────────┐
│ ‹ Search                             │
│ DIXON                                │
│ First time here. Reading its filings.│
├──────────────────────────────────────┤
│ READER 1 · concall transcripts       │
│ ✓ Q2 FY27    18 pages                │
│ ✓ Q1 FY27    21 pages                │
│ … Q4 FY26    reading p.9             │
│ · Q3 FY26    queued                  │
│                                      │
│ READER 2 · annual report             │
│ … FY26       reading p.40 of 312     │
├──────────────────────────────────────┤
│ Numbers are ready now              > │
└──────────────────────────────────────┘
```

### Screen 5 — No documents

```
┌──────────────────────────────────────┐
│ ‹ Search                             │
│ XYZLTD                               │
│ XYZ Limited · ₹212                   │
├──────────────────────────────────────┤
│ No concall transcripts or annual     │
│ reports found for this company.      │
│ FINN answers only from a company's   │
│ own documents, so it will not guess. │
│                                      │
│ Still available:                     │
│ NUMBERS  quarterly table           > │
│ FILINGS  NSE announcements         > │
└──────────────────────────────────────┘
```

### Screen 2, Option D — the user's blend (14 Nov, awaiting confirmation)

Header from Option A, tabs from Option B, and an ask bar that floats over every tab. Asking a question switches to the Ask tab; each tab keeps its scroll position, so going back to Brief returns to the same place.

Brief tab:

```
┌──────────────────────────────────────┐
│ FINN                [Search] [Rules] │
├──────────────────────────────────────┤
│ ‹ Search                             │
│ DIXON                                │
│ Dixon Technologies · Electronics     │
│ ₹14,820   M.cap ₹89,400 cr   P/E 72  │
├──────────────────────────────────────┤
│ [Brief]   Numbers   Documents   Ask  │
├──────────────────────────────────────┤
│ PROMISED VS DELIVERED    last 4 qtrs │
│ 2 met · 1 missed · 2 too early       │
│                                      │
│ MISSED  Margin 4.0-4.5%  ->  3.7%  v │
│ MET     Rev growth >30%  ->  +38%  v │
│ MET     Net debt zero    ->  zero  v │
│ EARLY   Capex ₹1,200 cr in FY27    v │
│ EARLY   Display fab by Q4 FY27     v │
│                                      │
│ BUSINESS IN THREE LINES              │
│ Contract maker of phones, TVs and    │
│ appliances for brands.               │
│ Annual report FY26, p.12           ↗ │
│                                      │
│ ╔══════════════════════════════════╗ │
│ ║ Ask about DIXON...             ↑ ║ │
│ ╚══════════════════════════════════╝ │
└──────────────────────────────────────┘
```

A row opened:

```
│ MISSED  Margin 4.0-4.5%  ->  3.7%  ^ │
│   Said  "we expect margins of 4 to   │
│         4.5% for the full year"      │
│         Q4 FY26 concall, p.6       ↗ │
│   Got   3.7%, Q2 FY27                │
│         Quarterly table            ↗ │
```

After a question is sent, the Ask tab:

```
┌──────────────────────────────────────┐
│ ‹ Search                             │
│ DIXON                                │
│ Dixon Technologies · Electronics     │
│ ₹14,820   M.cap ₹89,400 cr   P/E 72  │
├──────────────────────────────────────┤
│  Brief    Numbers   Documents  [Ask] │
├──────────────────────────────────────┤
│ Q  What did they guide on margins?   │
│                                      │
│ Management guided to an operating    │
│ margin of 4.0-4.5% for FY27 [1] and  │
│ repeated it a quarter later [2].     │
│ Q2 FY27 came in at 3.7% [3].         │
│                                      │
│ SOURCES                              │
│ 1  Q4 FY26 concall, p.6            ↗ │
│    "we expect margins of 4 to 4.5"   │
│ 2  Q1 FY27 concall, p.4            ↗ │
│ 3  Quarterly table, screener.in    ↗ │
│                                      │
│ NOT IN THE DOCUMENTS                 │
│ Any guidance for FY28.               │
│                                      │
│ ╔══════════════════════════════════╗ │
│ ║ Ask a follow-up...             ↑ ║ │
│ ╚══════════════════════════════════╝ │
└──────────────────────────────────────┘
```

Numbers tab: the quarterly table (Revenue, EBITDA, PBT, PAT, five quarters) and the price chart. No model.

Documents tab: every document FINN has read or is reading for this company, with page counts and links. This replaces the separate first-read screen (Screen 4): while reading is under way, the Brief tab shows one line, "Reading 3 of 5 documents", that opens this tab.

Ask tab before any question: three or four suggested questions.
