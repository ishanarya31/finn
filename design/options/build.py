# Generates the five FINN design options (a.html .. e.html) and index.html from one content model.
# Real data: the 7-day feed and the OLAELEC alert as served locally on 14 Nov 2026, 23:23 IST.
# The price line in the chart is illustrative; its end points (3M high/low, last close, -12.7%) are real.
import math, random, pathlib

OUT = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- content
ALERTS = [  # symbol, category, when (day, hh:mm), line html, foot
    ("OLAELEC", "Results", (12, "16:03"), 'Revenue <b class="num">₹421 cr</b> <span class="num down">−39% YoY</span> · PAT <b class="num down">−₹362 cr</b>', "5 filings, one event"),
    ("TATAPOWER", "Results", (11, "17:20"), 'Revenue <b class="num">₹19,636 cr</b> <span class="num up">+26% YoY</span> · PAT <b class="num">₹1,652 cr</b> <span class="num up">+33%</span>', "Volume 3.7× 20-day avg · 4 filings"),
    ("HDFCBANK", "Management change", (13, "16:35"), "Change in Director(s) of the company", ""),
    ("HDFCBANK", "Management change", (12, "17:33"), "Approval from the Reserve Bank of India for re-appointment of Mr. V. Srinivasa Rangan as Whole-time Director", ""),
    ("TATAPOWER", "Management change", (11, "19:22"), "Appointment of Mr Sanjay Kumar Banga as additional Executive Director w.e.f. November 11, 2026", "2 filings, one event"),
    ("ADANIENT", "M&amp;A", (11, "20:14"), "Incorporation of Adani Rovuma Chemicals Limited by Adani Global Limited, a wholly owned subsidiary", ""),
    ("ADANIENT", "M&amp;A", (8, "17:32"), "Completion of acquisition of 100% stake in Vizag Mega Data Center Park Limited by AdaniConneX", ""),
    ("BAJFINANCE", "Fund raise", (11, "17:13"), "Outcome of QIP 2026 – Special Committee meeting", ""),
    ("BAJFINANCE", "Fund raise", (10, "12:58"), "Allotment of 5,74,25,740 securities pursuant to Preferential Issue", ""),
    ("PAYTM", "Unusual move", (12, "15:30"), 'Price <b class="num up">+7.3%</b> · Volume <b class="num">3.0×</b> 20-day avg', "No material filing explains it"),
    ("OLAELEC", "Unusual move", (12, "15:30"), 'Price <b class="num up">+3.8%</b> · Volume <b class="num">2.1×</b> 20-day avg', "No material filing explains it"),
    ("INDUSINDBK", "Unusual move", (11, "15:30"), 'Price <b class="num up">+0.6%</b> · Volume <b class="num">2.6×</b> 20-day avg', "No material filing explains it"),
    ("TATAPOWER", "Unusual move", (11, "15:30"), 'Price <b class="num">0.0%</b> · Volume <b class="num">2.4×</b> 20-day avg', "No material filing explains it"),
]
MINOR = [("OLAELEC", "Link of Recording", (12, "19:01")), ("BHARTIARTL", "Transcript", (12, "17:36")),
         ("ADANIENT", "Media release: Kutch Copper and Codelco sign MoU for exploration in Chile", (12, "08:22")),
         ("TATAPOWER", "Link of Recording", (11, "20:35")), ("TATAPOWER", "Capacity addition", (11, "17:42")),
         ("ADANIENT", "Submission of Media Release", (11, "16:46")), ("LT", "Bagging/Receiving of orders/contracts", (9, "10:37"))]
QUIET = [("RELIANCE", 0.0), ("TCS", -1.4), ("PERSISTENT", -0.4), ("SUNPHARMA", -0.3), ("MARUTI", -1.3),
         ("ASIANPAINT", 0.5), ("VEDL", -0.3), ("POLYCAB", -2.2), ("TRENT", -0.5)]
HIDDEN = [("BHARTIARTL", "Copy of Newspaper Publication", (14, "15:52")), ("RELIANCE", "Analysts/Institutional Investor Meet", (13, "18:25")),
          ("PAYTM", "Updates", (13, "14:42")), ("TRENT", "General Updates", (13, "11:24")), ("OLAELEC", "Updates", (12, "22:42")),
          ("OLAELEC", "General Updates", (12, "22:39")), ("RELIANCE", "Analysts/Institutional Investor Meet", (12, "20:23")),
          ("INDUSINDBK", "Analysts/Institutional Investor Meet", (12, "17:47")), ("HDFCBANK", "Analysts/Institutional Investor Meet", (12, "14:27")),
          ("MARUTI", "Analysts/Institutional Investor Meet", (12, "11:57")), ("ADANIENT", "Analysts/Institutional Investor Meet", (11, "19:28")),
          ("BHARTIARTL", "Analysts/Institutional Investor Meet", (11, "18:33")), ("INDUSINDBK", "Analysts/Institutional Investor Meet", (11, "16:21")),
          ("TATAPOWER", "ESOP/ESOS/ESPS", (11, "13:45")), ("TATAPOWER", "Analysts/Institutional Investor Meet", (11, "09:57")),
          ("BAJFINANCE", "Committee Meeting Updates", (10, "12:15")), ("ASIANPAINT", "Analysts/Institutional Investor Meet", (9, "18:11")),
          ("TCS", "Analysts/Institutional Investor Meet", (9, "17:12")), ("INDUSINDBK", "Analysts/Institutional Investor Meet", (9, "15:10")),
          ("TRENT", "Analysts/Institutional Investor Meet", (9, "13:00"))]
SOURCES = [("Outcome of Board Meeting", "12 Nov, 16:03 · 1.41 MB"), ("Investor Presentation", "12 Nov, 16:19 · 16.93 MB"),
           ("Updates", "12 Nov, 16:28 · 16.93 MB"), ("Updates", "12 Nov, 18:48 · 471 KB"),
           ("Copy of Newspaper Publication", "13 Nov, 13:51 · 2.62 MB"), ("Quarterly table, screener.in", "₹ crore")]

fmt = lambda d: f"{d[0]} Nov, {d[1]}"
def hours(d):  # hours since the window opened (7 Nov 23:23)
    h, m = map(int, d[1].split(":"))
    return (d[0] - 7) * 24 + h + m / 60 - (23 + 23 / 60)

ICONS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 5.5l6.5 6.5L9 18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5.5L8.5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-out" viewBox="0 0 24 24"><path d="M8 16L16.5 7.5M9.5 7.5h7v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M12 19V5.5M6 11.5l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-feed" viewBox="0 0 24 24"><path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-port" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 7V5.5h6V7" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
<symbol id="i-rules" viewBox="0 0 24 24"><path d="M5 7.5h8M17 7.5h2M5 16.5h2M11 16.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15" cy="7.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="16.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
</svg>"""
ic = lambda n, c="ic": f'<svg class="{c}" aria-hidden="true"><use href="#i-{n}"/></svg>'

def chart():
    random.seed(7)
    keys = [(0, 39.7), (10, 43.53), (22, 38.2), (36, 30.4), (44, 28.92), (54, 33.1), (60, 36.6), (61, 35.7), (62, 34.65)]
    pts = []
    for i in range(63):
        for (a, va), (b, vb) in zip(keys, keys[1:]):
            if a <= i <= b:
                t = (i - a) / (b - a) if b > a else 0
                v = va + (vb - va) * (1 - math.cos(math.pi * t)) / 2
                break
        if i not in [k for k, _ in keys]:
            v += random.uniform(-0.7, 0.7)
        pts.append(v)
    W, H, lo, hi = 600, 170, 27.5, 45
    xy = [(i * W / 62, H - (v - lo) / (hi - lo) * H) for i, v in enumerate(pts)]
    line = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in xy)
    area = line + f" L{W},{H} L0,{H} Z"
    ex = 61 * W / 62
    return f"""<svg class="chart" viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="OLAELEC close over 3 months, −12.7%">
<path class="c-area" d="{area}"/><path class="c-line" d="{line}" vector-effect="non-scaling-stroke"/>
<line class="c-ev" x1="{ex:.1f}" x2="{ex:.1f}" y1="0" y2="{H}" vector-effect="non-scaling-stroke"/></svg>"""

def sky():  # every item of the window on one time axis, dot size by tier
    W, H = 400, 64
    x = lambda d: 8 + hours(d) / 168 * (W - 16)
    dots = []
    for i, (_, _, d, *_r) in enumerate(HIDDEN):
        dots.append(f'<circle class="s-h" cx="{x(d):.1f}" cy="{14 + (i * 13) % 40}" r="1.6"/>')
    for i, (_, _, d) in enumerate(MINOR):
        dots.append(f'<circle class="s-m" cx="{x(d):.1f}" cy="{20 + (i * 11) % 30}" r="3"/>')
    for i, a in enumerate(ALERTS):
        dots.append(f'<circle class="s-a" cx="{x(a[2]):.1f}" cy="{18 + (i * 17) % 32}" r="{7 if a[1] == "Results" else 5}"/>')
    ticks = "".join(f'<text x="{8 + (d - 7.976) / 7 * (W - 16):.0f}" y="{H - 1}">{d} Nov</text>' for d in (8, 10, 12, 14))
    return f'<svg class="sky" viewBox="0 0 {W} {H}" role="img" aria-label="13 alerts, 7 minor, 20 hidden over 7 days">{"".join(dots)}{ticks}</svg>'

def strip(kind):
    if kind == "seg":
        return """<nav class="seg" aria-label="Tiers"><a aria-current="true" style="flex-grow:13"><b class="num">13</b> Alerts</a><a style="flex-grow:7"><b class="num">7</b> Minor</a><a style="flex-grow:20"><b class="num">20</b> Hidden</a></nav>"""
    if kind == "sky":
        return sky()
    return """<div class="strip" role="img" aria-label="13 alerts, 7 minor, 20 hidden"><i class="s-a" style="flex-grow:13"></i><i class="s-m" style="flex-grow:7"></i><i class="s-h" style="flex-grow:20"></i></div><p class="strip-key"><span>Shown</span><span>Filtered out</span></p>"""

HIGHLIGHTS = """<div class="hl"><div><b class="num">₹421<small> cr</small></b><span>Revenue · <em class="down">−39% YoY</em></span></div><div><b class="num down">−₹218<small> cr</small></b><span>EBITDA · loss widened</span></div><div><b class="num down">−51.8%</b><span>EBITDA margin · was −29.4%</span></div></div>"""

def page(t):
    cards = "".join(
        f'<a class="card{" on" if i == 0 else ""}" href="#d" style="--i:{i}"><div class="ch"><span class="tk">{s}</span><span class="cat">{c}</span><time>{fmt(d)}</time></div>'
        f'<p class="ln">{ln}</p>{f"<p class=ft>{ft}</p>" if ft else ""}</a>' for i, (s, c, d, ln, ft) in enumerate(ALERTS))
    minor = lambda rows: "".join(f'<li><span class="tk">{s}</span><span class="tx">{x}</span><time>{fmt(d)}</time></li>' for s, x, d in rows)
    quiet = "".join(f'<li><span class="tk">{s}</span><span class="num {"up" if p > 0 else "down" if p < 0 else ""}">{"+" if p > 0 else "−" if p < 0 else ""}{abs(p):.1f}%</span></li>' for s, p in QUIET)
    hidden = "".join(f'<li><span class="tk">{s}</span><span class="tx">{x}</span><time>{fmt(d)}</time></li>' for s, x, d in HIDDEN)
    srcs = "".join(f'<li><a href="#d"><span>{n}</span><small class="num">{m}</small>{ic("out")}</a></li>' for n, m in SOURCES)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FINN · {t['name']}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{t['fonts']}&display=swap" rel="stylesheet"><style>{BASE}{t['css']}</style></head>
<body class="t-{t['id']}">{ICONS}<div class="bg" aria-hidden="true"></div>
<header class="top glass"><a class="mark" href="#">FINN</a>
<label class="find">{ic("search")}<input placeholder="Search any NSE company" aria-label="Search any NSE company"></label>
<nav class="nav" aria-label="Main"><a href="#" aria-current="page">{ic("feed")}<span>Feed</span></a><a href="#" class="n-search">{ic("search")}<span>Search</span></a><a href="#">{ic("port")}<span>Portfolio</span></a><a href="#">{ic("rules")}<span>Rules</span></a></nav></header>
<div class="shell">
<section class="list" aria-label="Feed">
<div class="lede glass"><h1><span class="n num">13</span> need you</h1>
<p class="sub"><b class="num">7</b> minor · <b class="num">20</b> hidden · <b class="num">9</b> of 18 holdings quiet</p>{strip(t['strip'])}
<nav class="win" aria-label="Time window"><a href="#">24h</a><a href="#">3d</a><a href="#" aria-current="true">7d</a><a href="#">Custom</a></nav></div>
<h2 class="sh">Alerts <span class="c num">13</span></h2><div class="alerts">{cards}</div>
<h2 class="sh">Minor <span class="c num">7</span></h2><ul class="rows glass">{minor(MINOR[:4])}<li class="more">+ 3 more</li></ul>
<details class="fold glass"><summary>Quiet <span class="c num">9</span><span class="d">holdings, nothing material</span>{ic("chev","ic chev")}</summary><ul class="quiet">{quiet}</ul></details>
<details class="fold glass hid"><summary>Hidden <span class="c num">20</span><span class="d">routine filings</span>{ic("chev","ic chev")}</summary><ul class="rows">{hidden}</ul></details>
<p class="foot">Filings: NSE. Prices: Yahoo Finance, end of day. Results: screener.in. Read 14 Nov, 23:23 IST.</p>
</section>
<article class="detail glass" id="d" aria-label="Alert">
<a class="back" href="#">{ic("back")}Feed</a>
<header class="dh"><div class="dt"><h2><span class="tk">OLAELEC</span></h2><p>Ola Electric Mobility Ltd · 2/3 Wheelers</p></div>
<dl class="facts"><div><dt>Price</dt><dd class="num">₹34.6</dd></div><div><dt>M.cap</dt><dd class="num">₹17,320 cr</dd></div></dl>
<p class="badge"><span>Results</span><time>12 Nov, 16:03 IST</time></p></header>
{HIGHLIGHTS if t.get('hl') else ''}
<section class="blk"><h3>What happened</h3><p>The unaudited financial results for the quarter and half-year ended September 30, 2026.</p>
<table class="tab"><thead><tr><th>₹ cr · Sep 2026</th><th>Qtr</th><th>QoQ</th><th>YoY</th></tr></thead><tbody>
<tr><th>Revenue</th><td>421</td><td class="down">−7%</td><td class="down">−39%</td></tr><tr><th>EBITDA</th><td>−218</td><td>n/m</td><td>n/m</td></tr>
<tr><th>PBT</th><td>−362</td><td>n/m</td><td>n/m</td></tr><tr><th>PAT</th><td>−362</td><td>n/m</td><td>n/m</td></tr></tbody></table></section>
<section class="blk cbox"><div class="ctop"><p><b class="num">₹34.65</b> <span class="num down">−12.7%</span> <span class="muted">over 3M · 13 Nov</span></p>
<nav class="win sm" aria-label="Range"><a href="#">1M</a><a href="#" aria-current="true">3M</a><a href="#">1Y</a><a href="#">5Y</a></nav></div>
<div class="cwrap"><div class="yax num"><span>43.53</span><span>36.23</span><span>28.92</span></div>{chart()}</div>
<div class="xax num"><span>13 Aug</span><span>28 Sept</span><span>13 Nov</span></div><p class="muted cap">Close, ₹. Marked: the event day.</p></section>
<section class="blk"><h3>Why it matters</h3><p class="why">Q2 FY27 revenue fell 7% QoQ and 39% YoY to ₹421 crore, while the EBITDA loss was ₹218 crore and margin worsened to −51.8%. The supplied facts lack cash, debt or guidance detail.</p>
<ul class="kv"><li>EBITDA margin <b class="num down">−51.8%</b>, against −36.3% last quarter and −29.4% a year ago.</li><li>First close after the filing: <b class="num down">−3.0%</b> on 1.1× average volume. No threshold crossed.</li></ul></section>
<section class="blk"><h3>What to check next</h3><ol class="next"><li>Q2 FY27 investor presentation: revenue mix and cost lines</li><li>Q2 FY27 KPI data book: volumes, deliveries, capacity utilisation</li><li>Q2 FY27 shareholders' letter: cash balance and funding plans</li></ol></section>
<section class="blk"><h3>Sources</h3><ul class="src">{srcs}</ul></section>
<a class="research" href="#"><span><b>Research OLAELEC</b><small>Promised vs delivered, the numbers, and questions answered from its filings</small></span>{ic("chev")}</a>
<form class="ask glass" onsubmit="return false"><input placeholder="Ask Finn about OLAELEC" aria-label="Ask Finn about OLAELEC"><button aria-label="Send">{ic("send")}</button></form>
</article></div></body></html>"""

# ---------------------------------------------------------------- structure shared by every option
BASE = r"""
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;min-height:100vh;color:var(--ink);background:var(--ground);font:400 15px/1.45 var(--f-ui);-webkit-font-smoothing:antialiased}
h1,h2,h3,p,ul,ol,dl,dd{margin:0;padding:0}ul,ol{list-style:none}a{color:inherit;text-decoration:none}
::selection{background:var(--accent);color:var(--accent-ink)}:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}
*{scrollbar-width:thin;scrollbar-color:var(--ink3) transparent}
.bg{position:fixed;inset:0;z-index:-1;pointer-events:none}
.num,time{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}.tab td,.yax,.xax,.sky text{font-family:var(--f-num);font-variant-numeric:tabular-nums}
.up{color:var(--up)}.down{color:var(--down)}.muted{color:var(--ink2)}
.ic{width:18px;height:18px;flex:none}
.glass{position:relative;background:var(--pane);border:1px solid var(--pane-brd);border-radius:var(--r);box-shadow:var(--pane-shadow);
 -webkit-backdrop-filter:blur(var(--blur)) saturate(var(--sat));backdrop-filter:blur(var(--blur)) saturate(var(--sat))}
/* top bar: the glass sits on a pseudo-element, so the bar does not become the containing block of the fixed phone tab bar */
.top.glass{background:none;border-color:transparent;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
.top::after{content:"";position:absolute;inset:-1px;z-index:-1;border-radius:inherit;background:var(--pane);border:1px solid var(--pane-brd);box-shadow:var(--pane-shadow);-webkit-backdrop-filter:blur(var(--blur)) saturate(var(--sat));backdrop-filter:blur(var(--blur)) saturate(var(--sat))}
.top{position:sticky;top:12px;z-index:10;display:flex;align-items:center;gap:12px;width:calc(100% - 24px);max-width:1360px;margin:12px auto 0;padding:6px;border-radius:999px}
.mark{padding:0 12px 0 14px;font-weight:800;font-size:18px;letter-spacing:.16em}
.find{display:flex;align-items:center;gap:8px;flex:1;max-width:380px;height:40px;padding:0 14px;border-radius:999px;background:var(--well);color:var(--ink2)}
.find input{flex:1;min-width:0;border:0;background:none;font:inherit;color:var(--ink);outline:none}.find input::placeholder{color:var(--ink2)}
.nav{display:flex;gap:2px;margin-left:auto}
.nav a{display:flex;align-items:center;gap:7px;height:40px;padding:0 16px;border-radius:999px;color:var(--ink2);font-weight:550;transition:background .25s,color .25s}
.nav a:hover{color:var(--ink);background:var(--well)}.nav a[aria-current]{background:var(--sel);color:var(--sel-ink);box-shadow:var(--sel-shadow)}
.nav .n-search{display:none}
/* shell */
.shell{display:grid;gap:16px;max-width:1360px;margin:16px auto 0;padding:0 12px 32px}
.list{display:flex;flex-direction:column;gap:12px;min-width:0}
.lede{padding:22px 22px 16px}.lede h1{display:flex;align-items:baseline;gap:10px;font-size:26px;font-weight:650;letter-spacing:-.02em}
.lede .n{font-size:52px;line-height:1;font-weight:600;letter-spacing:-.04em;color:var(--accent-text)}
.sub{margin-top:8px;color:var(--ink2);font-size:14px}.sub b{color:var(--ink);font-weight:600}
.strip{display:flex;gap:3px;height:8px;margin-top:16px}.strip i{border-radius:4px}.strip .s-a{background:var(--accent)}.strip .s-m{background:var(--ink3)}.strip .s-h{background:var(--well2)}
.strip-key{display:flex;justify-content:space-between;margin-top:6px;font-size:12px;color:var(--ink2)}
.win{display:flex;gap:2px;margin-top:16px;padding:3px;border-radius:999px;background:var(--well)}
.win a{flex:1;text-align:center;padding:7px 0;border-radius:999px;font-size:13.5px;font-weight:550;color:var(--ink2);transition:background .25s,color .25s}
.win a[aria-current]{background:var(--sel);color:var(--sel-ink);box-shadow:var(--sel-shadow)}
.win.sm{margin:0;flex:none}.win.sm a{padding:5px 11px;font-size:12.5px}
.sh{display:flex;align-items:baseline;gap:8px;margin:14px 6px 0;font-size:13px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--sh)}
.c{font-weight:500;color:var(--ink2);letter-spacing:0}
.alerts{display:flex;flex-direction:column;gap:8px}
.card{display:block;padding:14px 16px;border-radius:calc(var(--r) - 4px);background:var(--card);border:1px solid var(--card-brd);box-shadow:var(--card-shadow);
 -webkit-backdrop-filter:blur(var(--blur)) saturate(var(--sat));backdrop-filter:blur(var(--blur)) saturate(var(--sat));
 transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,background .35s,opacity .35s;animation:rise .6s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i)*35ms)}
@keyframes rise{from{opacity:0;transform:translateY(8px)}}
.card:hover{transform:translateY(-1px)}.card.on{background:var(--card-on);border-color:var(--card-on-brd);box-shadow:var(--card-on-shadow)}
.ch{display:flex;align-items:baseline;gap:8px}.tk{font-weight:700;letter-spacing:.02em}
.cat{font-size:12.5px;font-weight:550;color:var(--cat);padding:2px 8px;border-radius:999px;background:var(--cat-bg)}
.ch time{margin-left:auto;font-size:12px;color:var(--ink2);white-space:nowrap}
.ln{margin-top:6px;font-size:14px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ln b{font-weight:600}
.ft{margin-top:6px;font-size:12.5px;color:var(--ink2)}
.rows{padding:4px 0}.rows li{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:baseline;padding:10px 16px;font-size:13.5px}
.rows li+li{border-top:1px solid var(--line)}.rows .tx{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--ink2)}.rows time{font-size:12px;color:var(--ink2)}
.rows .more{display:block;color:var(--ink2);font-weight:550}
.fold summary{display:flex;align-items:baseline;gap:8px;padding:14px 16px;cursor:pointer;list-style:none;font-weight:650}.fold summary::-webkit-details-marker{display:none}
.fold .d{color:var(--ink2);font-weight:400;font-size:13.5px}.fold .chev{margin-left:auto;align-self:center;transition:transform .3s;color:var(--ink2)}.fold[open] .chev{transform:rotate(90deg)}
.quiet{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;padding:0 12px 14px}
.quiet li{display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:var(--well);font-size:13px}
.hid .tx{text-decoration:line-through;text-decoration-color:var(--ink3)}
.foot{margin:6px 6px 0;font-size:12px;color:var(--og2,var(--ink2))}.list>.sh{color:var(--og,var(--sh))}.list>.sh .c{color:var(--og2,var(--ink2))}
/* detail */
.detail{padding:26px 28px 20px;min-width:0}
.back{display:none;align-items:center;gap:4px;margin:-6px 0 14px -6px;font-weight:600;color:var(--accent-text)}
.dh{display:grid;grid-template-columns:1fr auto;gap:6px 24px;align-items:end;padding-bottom:20px;border-bottom:1px solid var(--line)}
.dt h2{font-size:30px;font-weight:700;letter-spacing:-.01em}.dt p{color:var(--ink2);margin-top:2px}
.facts{display:flex;gap:22px}.facts dt{font-size:12px;color:var(--ink2)}.facts dd{font-size:18px;font-weight:600}
.badge{grid-column:1/-1;display:flex;gap:10px;align-items:center;margin-top:8px;font-size:13px}
.badge span{padding:4px 10px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:650}.badge time{color:var(--ink2)}
.blk{padding:22px 0;border-bottom:1px solid var(--line)}.blk h3{margin-bottom:10px;font-size:13px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--sh)}
.blk>p{max-width:68ch}
.tab{width:100%;max-width:560px;margin-top:14px;border-collapse:collapse;font-size:14px}
.tab th,.tab td{padding:9px 0;text-align:right;border-bottom:1px solid var(--line);font-weight:500}.tab tr>:first-child{text-align:left}
.tab thead th{font-size:12px;color:var(--ink2);font-weight:550}.tab tbody th{font-weight:600}
.ctop{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.ctop b{font-size:22px;font-weight:600}
.cwrap{display:grid;grid-template-columns:auto 1fr;gap:10px;margin-top:16px}.yax{display:flex;flex-direction:column;justify-content:space-between;font-size:11.5px;color:var(--ink2)}
.chart{display:block;width:100%;height:180px;overflow:visible}.c-line{fill:none;stroke:var(--chart);stroke-width:2;stroke-linejoin:round}.c-area{fill:var(--chart-fill)}
.c-ev{stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3}
.xax{display:flex;justify-content:space-between;margin:6px 0 0 44px;font-size:11.5px;color:var(--ink2)}.cap{margin-top:8px;font-size:12.5px}
.why{font-size:16px;line-height:1.55}.kv{margin-top:12px;display:grid;gap:6px;font-size:14px;color:var(--ink2)}.kv b{font-weight:600}
.next{counter-reset:n;display:grid;gap:8px}.next li{counter-increment:n;display:flex;gap:12px;align-items:baseline;padding:12px 14px;border-radius:14px;background:var(--well)}
.next li::before{content:counter(n);font:600 12px/1 var(--f-num);color:var(--accent-text)}
.src{display:grid;gap:2px}.src a{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:0 -12px;border-radius:12px;transition:background .2s}.src a:hover{background:var(--well)}
.src span{font-weight:550}.src small{margin-left:auto;color:var(--ink2);font-size:12px}.src .ic{color:var(--ink2);width:16px;height:16px}
.research{display:flex;align-items:center;gap:12px;margin-top:22px;padding:18px 20px;border-radius:calc(var(--r) - 4px);background:var(--sel);color:var(--sel-ink);box-shadow:var(--sel-shadow)}
.research span{flex:1;display:grid;gap:2px}.research small{opacity:.8}
.ask{position:sticky;bottom:12px;display:flex;align-items:center;gap:8px;margin-top:22px;padding:6px 6px 6px 18px;border-radius:999px}
.ask input{flex:1;min-width:0;border:0;background:none;font:inherit;color:var(--ink);outline:none;height:40px}.ask input::placeholder{color:var(--ink2)}
.ask button{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:var(--accent);color:var(--accent-ink);cursor:pointer}
/* desktop: two panes */
@media (min-width:980px){
 .shell{grid-template-columns:minmax(380px,440px) 1fr;align-items:start}
 .list,.detail{position:sticky;top:76px;max-height:calc(100vh - 88px);overflow:auto;overscroll-behavior:contain}
 .list{padding:2px 4px 2px 2px}
 .alerts:has(.on) .card:not(.on):not(:hover){opacity:var(--dim,1)}
}
/* phone: list, then the alert as a full sheet */
@media (max-width:979px){
 .find{display:none}.top{justify-content:center}.mark{padding:6px 0}
 .nav{position:fixed;z-index:15;left:12px;right:12px;bottom:12px;justify-content:space-around;margin:0;padding:6px;border-radius:999px;
  background:var(--pane);border:1px solid var(--pane-brd);box-shadow:var(--pane-shadow);-webkit-backdrop-filter:blur(var(--blur)) saturate(var(--sat));backdrop-filter:blur(var(--blur)) saturate(var(--sat))}
 .nav a{flex:1;flex-direction:column;gap:2px;height:52px;justify-content:center;padding:0;font-size:11px}.nav .ic{width:20px;height:20px}.nav .n-search{display:flex}
 .shell{grid-template-columns:minmax(0,1fr);padding-bottom:96px}
 .detail{display:none}
 .detail:target{display:block;position:fixed;inset:0;z-index:20;border-radius:0;border:0;overflow:auto;padding:18px 16px 24px;background:var(--sheet);animation:sheet .45s cubic-bezier(.16,1,.3,1)}
 .back{display:inline-flex}.dh{grid-template-columns:1fr}.facts{gap:18px}
 body:has(.detail:target) .nav{display:none}
}
@keyframes sheet{from{transform:translateY(24px);opacity:0}}
@media (prefers-reduced-motion:reduce){*,*::before{animation:none!important;transition:none!important}}
"""

# ---------------------------------------------------------------- the five worlds
THEMES = [
 dict(id="a", name="Highlights", strip="bar", hl=True,
  fonts="family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@400;500;600",
  css=r""":root{--f-ui:"Schibsted Grotesk",system-ui,sans-serif;--f-num:"Spline Sans Mono",ui-monospace,monospace;
 --ground:#1b36a8;--ink:#0b1330;--ink2:#4a5476;--ink3:#a9b1cc;--accent:#1b36a8;--accent-ink:#fff;--accent-text:#1b36a8;--up:#0d7a45;--down:#c0281c;
 --pane:rgba(248,250,255,.80);--pane-brd:rgba(255,255,255,.7);--pane-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 24px 60px -24px rgba(6,16,70,.6);
 --r:24px;--blur:22px;--sat:1.5;--well:rgba(27,54,168,.07);--well2:rgba(27,54,168,.16);--line:rgba(11,19,48,.1);--sh:#0b1330;
 --sel:#1b36a8;--sel-ink:#fff;--sel-shadow:0 6px 18px -6px rgba(27,54,168,.6);
 --card:rgba(248,250,255,.72);--card-brd:rgba(255,255,255,.55);--card-shadow:0 10px 30px -18px rgba(6,16,70,.6);
 --card-on:#fff;--card-on-brd:#fff;--card-on-shadow:0 0 0 2px #fff,0 18px 40px -16px rgba(6,16,70,.75);--dim:.78;
 --cat:#1b36a8;--cat-bg:rgba(27,54,168,.09);--og:#fff;--og2:rgba(255,255,255,.75);--chart:#1b36a8;--chart-fill:rgba(27,54,168,.08);--sheet:#f4f6fd}
.bg{background:radial-gradient(1200px 700px at 85% 110%,#2f56e6 0,transparent 60%),radial-gradient(900px 600px at 0% 0%,#14287f 0,transparent 60%),#1b36a8}
.bg::after{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 92% 108%,transparent 0 46px,rgba(255,255,255,.07) 46px 47px);mask:radial-gradient(900px 900px at 92% 108%,#000 30%,transparent 75%)}
.top .mark{color:#1b36a8}
.hl{display:grid;grid-template-columns:repeat(3,1fr);margin-top:22px;border-block:1px solid var(--line)}
.hl div{padding:18px 16px 16px;display:grid;gap:6px}.hl div+div{border-left:1px solid var(--line)}
.hl b{font:600 40px/1 var(--f-ui);letter-spacing:-.04em;font-variant-numeric:tabular-nums}.hl small{font-size:.45em;letter-spacing:0;margin-left:2px}
.hl span{font-size:13px;color:var(--ink2)}.hl em{font-style:normal;font-weight:600}
.dh{border:0;padding-bottom:0}
@media (max-width:979px){.hl{grid-template-columns:1fr}.hl div+div{border-left:0;border-top:1px solid var(--line)}.hl b{font-size:34px}}
"""),
 dict(id="b", name="Pink Sheet", strip="seg",
  fonts="family=Onest:wght@400;500;600;700;800&family=Red+Hat+Mono:wght@400;500;600",
  css=r""":root{--f-ui:"Onest",system-ui,sans-serif;--f-num:"Red Hat Mono",ui-monospace,monospace;
 --ground:#f2d3c1;--ink:#2a1811;--ink2:#6f4a3c;--ink3:#c49a87;--accent:#a3123a;--accent-ink:#fff;--accent-text:#a3123a;--up:#1d6b39;--down:#a3123a;
 --pane:rgba(255,245,238,.58);--pane-brd:rgba(255,255,255,.75);--pane-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 18px 44px -24px rgba(90,30,10,.45);
 --r:22px;--blur:26px;--sat:1.4;--well:rgba(120,50,25,.07);--well2:rgba(120,50,25,.15);--line:rgba(80,30,15,.11);--sh:#6f4a3c;
 --sel:#2a1811;--sel-ink:#fff4ec;--sel-shadow:0 6px 16px -8px rgba(42,24,17,.7);
 --card:rgba(255,246,240,.55);--card-brd:rgba(255,255,255,.6);--card-shadow:0 8px 24px -18px rgba(90,30,10,.5);
 --card-on:rgba(255,250,246,.92);--card-on-brd:rgba(163,18,58,.35);--card-on-shadow:0 14px 34px -18px rgba(90,30,10,.6);--dim:1;
 --cat:#a3123a;--cat-bg:rgba(163,18,58,.08);--chart:#2a1811;--chart-fill:rgba(163,18,58,.07);--sheet:#f6ddce}
.bg{background:radial-gradient(700px 500px at 10% 10%,#f7e4d8 0,transparent 70%),radial-gradient(800px 600px at 90% 30%,#ebb79f 0,transparent 65%),radial-gradient(700px 500px at 40% 100%,#f0c4ae 0,transparent 70%),#f2d3c1}
.bg::after{content:"";position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.seg{display:flex;gap:4px;margin-top:16px;padding:4px;border-radius:16px;background:var(--well)}
.seg a{display:flex;align-items:baseline;justify-content:center;gap:6px;min-width:84px;padding:10px 8px;border-radius:12px;font-size:13px;font-weight:550;color:var(--ink2)}
.seg a b{font-size:16px;color:var(--ink)}.seg a[aria-current]{background:var(--accent);color:#fff;box-shadow:0 8px 18px -8px rgba(163,18,58,.8)}.seg a[aria-current] b{color:#fff}
.card.on .tk{color:var(--accent)}
"""),
 dict(id="c", name="Magnitude", strip="sky",
  fonts="family=Hanken+Grotesk:wght@400;500;600;700;800&family=Azeret+Mono:wght@400;500;600",
  css=r""":root{color-scheme:dark;--f-ui:"Hanken Grotesk",system-ui,sans-serif;--f-num:"Azeret Mono",ui-monospace,monospace;
 --ground:#0a1021;--ink:#f0efe6;--ink2:#9ba7c6;--ink3:#4a5a80;--accent:#ff5a3c;--accent-ink:#1a0a05;--accent-text:#ff7a5f;--up:#6fd69b;--down:#ff8a75;
 --pane:rgba(22,35,64,.52);--pane-brd:rgba(160,185,240,.16);--pane-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 24px 60px -20px rgba(0,0,0,.7);
 --r:22px;--blur:20px;--sat:1.3;--well:rgba(160,185,240,.08);--well2:rgba(160,185,240,.14);--line:rgba(160,185,240,.12);--sh:#9ba7c6;
 --sel:rgba(255,90,60,.16);--sel-ink:#ffb4a3;--sel-shadow:inset 0 0 0 1px rgba(255,90,60,.4);
 --card:rgba(22,35,64,.45);--card-brd:rgba(160,185,240,.12);--card-shadow:none;
 --card-on:rgba(40,56,96,.7);--card-on-brd:rgba(255,90,60,.55);--card-on-shadow:0 18px 40px -18px rgba(0,0,0,.8);--dim:.62;
 --cat:#c9d3ee;--cat-bg:rgba(160,185,240,.1);--chart:#f0efe6;--chart-fill:rgba(240,239,230,.05);--sheet:#0c1326}
.bg{background:radial-gradient(900px 600px at 80% 10%,#1a2a52 0,transparent 65%),radial-gradient(700px 500px at 10% 90%,#16233d 0,transparent 65%),#0a1021}
.bg::after{content:"";position:absolute;inset:0;background-image:radial-gradient(1px 1px at 20px 30px,#fff8,transparent),radial-gradient(1px 1px at 120px 80px,#fff6,transparent),radial-gradient(1.5px 1.5px at 200px 150px,#fffa,transparent),radial-gradient(1px 1px at 60px 190px,#fff5,transparent),radial-gradient(1px 1px at 170px 20px,#fff7,transparent),radial-gradient(1px 1px at 240px 230px,#fff4,transparent);background-size:260px 260px}
.sky{display:block;width:100%;height:70px;margin-top:16px}.sky text{font:500 9px var(--f-num);fill:var(--ink2)}
.sky .s-a{fill:var(--accent);stroke:rgba(255,90,60,.35);stroke-width:4}.sky .s-m{fill:#f0efe6;opacity:.85}.sky .s-h{fill:#9ba7c6;opacity:.5}
.card{display:grid;grid-template-columns:14px 1fr;column-gap:12px}.card::before{content:"";grid-row:1/4;width:12px;height:12px;margin-top:4px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(255,90,60,.18)}
.card .ch,.card .ln,.card .ft{grid-column:2}
.card[style*="--i:2"]::before,.card[style*="--i:3"]::before,.card[style*="--i:4"]::before,.card[style*="--i:5"]::before,.card[style*="--i:6"]::before,.card[style*="--i:7"]::before,.card[style*="--i:8"]::before{width:10px;height:10px;margin:5px 0 0 1px}
.card[style*="--i:9"]::before,.card[style*="--i:10"]::before,.card[style*="--i:11"]::before,.card[style*="--i:12"]::before{width:8px;height:8px;margin:6px 0 0 2px;box-shadow:0 0 0 3px rgba(255,90,60,.14)}
.rows li::before{content:"";width:5px;height:5px;border-radius:50%;background:#f0efe6;opacity:.8;align-self:center;margin-right:-2px}.rows li{grid-template-columns:5px auto 1fr auto}
.hid .rows li::before{width:3px;height:3px;opacity:.45}.rows .more::before{display:none}
.top .mark{color:#fff}.lede .n{color:#fff}
.dt h2 .tk{font-weight:600}
"""),
 dict(id="d", name="Section Boards", strip="bar",
  fonts="family=Mona+Sans:wght@400;500;600;700;800;900&family=Fragment+Mono",
  css=r""":root{--f-ui:"Mona Sans",system-ui,sans-serif;--f-num:"Fragment Mono",ui-monospace,monospace;
 --ground:#f2b705;--ink:#191814;--ink2:#56523f;--ink3:#b3a46a;--accent:#191814;--accent-ink:#ffd84a;--accent-text:#191814;--up:#1f7a35;--down:#c03a12;
 --pane:rgba(255,253,244,.72);--pane-brd:rgba(255,255,255,.8);--pane-shadow:inset 0 1px 0 #fff,0 2px 0 rgba(120,90,0,.12),0 22px 50px -26px rgba(90,60,0,.55);
 --r:26px;--blur:18px;--sat:1.2;--well:rgba(25,24,20,.06);--well2:rgba(25,24,20,.14);--line:rgba(25,24,20,.1);--sh:#191814;
 --sel:#191814;--sel-ink:#fff6cf;--sel-shadow:0 8px 18px -8px rgba(25,24,20,.6);
 --card:rgba(255,253,244,.62);--card-brd:rgba(255,255,255,.7);--card-shadow:0 1px 0 rgba(120,90,0,.12);
 --card-on:#fffdf4;--card-on-brd:#fff;--card-on-shadow:0 20px 40px -20px rgba(90,60,0,.7);--dim:.85;
 --cat:#191814;--cat-bg:rgba(242,183,5,.35);--chart:#191814;--chart-fill:rgba(242,183,5,.25);--sheet:#fbf3d2}
.bg{background:linear-gradient(180deg,#f5c21c,#eeae00)}
.bg::after{content:"";position:absolute;inset:0;opacity:.25;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 0 0 0 0 .25 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.lede h1,.dt h2{font-weight:850;font-stretch:112%}.lede .n{color:var(--ink);font-weight:800;font-stretch:112%}
.mark{font-weight:900;font-stretch:125%}
.strip .s-a{background:#191814}
.nav a:nth-child(1){--hue:#f2b705}.nav a:nth-child(2){--hue:#2350c8}.nav a:nth-child(3){--hue:#3f9a34}.nav a:nth-child(4){--hue:#e8641b}
.nav a::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--hue);box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}.nav a .ic{display:none}
@media (min-width:980px){
 .nav{position:fixed;right:0;top:120px;flex-direction:column;gap:6px;z-index:12}
 .nav a{writing-mode:vertical-rl;height:auto;padding:22px 12px 22px 14px;border-radius:18px 0 0 18px;background:var(--hue);color:#fff;font-weight:700;letter-spacing:.04em;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 18px -10px rgba(0,0,0,.4);transform:translateX(8px);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
 .nav a:nth-child(1){color:#191814}.nav a::before{display:none}.nav a:hover{transform:translateX(0);background:var(--hue);color:#fff}.nav a:nth-child(1):hover{color:#191814}
 .nav a[aria-current]{background:var(--hue);color:#191814;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),-6px 0 0 -2px rgba(255,253,244,.7);padding-block:34px;transform:translateX(0)}
 .nav .n-search{display:flex}.shell{padding-right:64px}.top{justify-content:space-between;max-width:1300px}
}
@media (max-width:979px){.nav a[aria-current]{background:#191814;color:#ffd84a}.nav a{gap:4px}}
"""),
 dict(id="e", name="Liquid", strip="bar",
  fonts="family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600",
  css=r""":root{--f-ui:"Geist",system-ui,sans-serif;--f-num:"Geist Mono",ui-monospace,monospace;
 --ground:#e6ecf7;--ink:#0b0d12;--ink2:#596071;--ink3:#b4bccb;--accent:#0a66ff;--accent-ink:#fff;--accent-text:#0a5ae0;--up:#11804a;--down:#d4321f;
 --pane:rgba(255,255,255,.5);--pane-brd:rgba(255,255,255,.85);--pane-shadow:inset 0 1px 1px rgba(255,255,255,.95),inset 0 -1px 1px rgba(255,255,255,.35),0 1px 2px rgba(20,30,60,.06),0 20px 50px -20px rgba(20,30,60,.3);
 --r:28px;--blur:30px;--sat:1.9;--well:rgba(10,20,50,.05);--well2:rgba(10,20,50,.1);--line:rgba(10,20,50,.08);--sh:#596071;
 --sel:#fff;--sel-ink:#0b0d12;--sel-shadow:0 1px 2px rgba(20,30,60,.12),0 6px 16px -6px rgba(20,30,60,.25);
 --card:rgba(255,255,255,.45);--card-brd:rgba(255,255,255,.8);--card-shadow:inset 0 1px 1px rgba(255,255,255,.9),0 10px 30px -18px rgba(20,30,60,.35);
 --card-on:rgba(255,255,255,.85);--card-on-brd:#fff;--card-on-shadow:inset 0 1px 1px #fff,0 0 0 2px rgba(10,102,255,.35),0 16px 36px -16px rgba(20,30,60,.4);--dim:1;
 --cat:#0a5ae0;--cat-bg:rgba(10,102,255,.09);--chart:#0a66ff;--chart-fill:rgba(10,102,255,.08);--sheet:#eef2f9}
.bg{background:radial-gradient(600px 500px at 15% 15%,#9cc4ff 0,transparent 70%),radial-gradient(700px 500px at 85% 20%,#b9f0dd 0,transparent 70%),radial-gradient(700px 600px at 70% 95%,#f7cfe2 0,transparent 70%),radial-gradient(600px 500px at 5% 90%,#cfd6ff 0,transparent 70%),#e6ecf7}
.glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,255,255,0) 40%,rgba(255,255,255,0) 70%,rgba(255,255,255,.25))}
.research{background:var(--accent);color:#fff;box-shadow:0 10px 24px -10px rgba(10,102,255,.7)}
.lede .n{color:var(--ink)}
"""),
]

for t in THEMES:
    (OUT / f"{t['id']}.html").write_text(page(t), encoding="utf-8")

# ---------------------------------------------------------------- chooser
CARDS = [
 ("a", "Highlights", "Annual-report highlights", "Milk-glass panes over a deep cobalt cover plate, the concentric rule of an annual-report cover behind them. The alert opens on a highlights spread: the quarter's three figures set large, like page two of a report.", ["#1b36a8", "#f8faff", "#0b1330", "#c0281c"], "Schibsted Grotesk · Spline Sans Mono", "The cobalt is loud for something opened every day; it should be checked on a long session."),
 ("b", "Pink Sheet", "The financial pink paper", "Warm glass over salmon newsprint with a faint fibre. The tier bar is the navigation: Alerts 13 · Minor 7 · Hidden 20, each segment as wide as its count, so the filter's work is visible before anything is read.", ["#f2d3c1", "#a3123a", "#2a1811", "#fff5ee"], "Onest · Red Hat Mono", "Familiar: every reader of the pink papers knows this ground. That is both the appeal and the risk."),
 ("c", "Magnitude", "Star-atlas chart (dark)", "Night-navy glass over a faint star field. Importance is dot size, as on a star chart: alerts are large red-amber points, minor items small, hidden filings faint. A sky strip plots the whole 7-day window by time.", ["#0a1021", "#ff5a3c", "#f0efe6", "#9ba7c6"], "Hanken Grotesk · Azeret Mono", "Dark only; dense tables in a bright office read less well than on light panes."),
 ("d", "Section Boards", "Reference-manual tab boards", "Milk acetate glass over a full-strength chrome-yellow board. Each section owns a hue (Feed yellow, Search ultramarine, Portfolio grass, Rules oxide), shown as coloured tabs on the right edge; the current one is the board.", ["#f2b705", "#2350c8", "#3f9a34", "#e8641b"], "Mona Sans · Fragment Mono", "The strongest colour of the five; least like a typical finance app."),
 ("e", "Liquid", "Category standard, played straight", "Clear liquid glass with a soft colour wallpaper behind it and white, specular panes, close to Apple's current system look. Neutral ink, one blue accent.", ["#e6ecf7", "#0a66ff", "#0b0d12", "#ffffff"], "Geist · Geist Mono", "The most familiar option; it reads as modern, but other apps look like it too."),
]
cards = "".join(f"""<section class="opt"><header><h2><span>{k.upper()}</span>{n}</h2><p class="w">{w}</p></header>
<div class="frames"><div class="fd"><iframe src="{k}.html" title="{n}, desktop" loading="lazy" tabindex="-1"></iframe></div>
<div class="fp"><iframe src="{k}.html" title="{n}, phone feed" loading="lazy" tabindex="-1"></iframe></div><div class="fp"><iframe src="{k}.html#d" title="{n}, phone alert" loading="lazy" tabindex="-1"></iframe></div></div>
<div class="meta"><p>{d}</p><ul class="chips">{''.join(f'<li style="background:{c}"></li>' for c in cs)}</ul><p class="f">{f}</p><p class="r"><b>Risk:</b> {r}</p>
<a href="{k}.html" target="_blank">Open {n} full size</a></div></section>""" for k, n, w, d, cs, f, r in CARDS)
(OUT / "index.html").write_text(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FINN design options</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f4f4f2;color:#141414;font:400 15px/1.5 Geist,system-ui,sans-serif}}main{{max-width:1500px;margin:0 auto;padding:32px 16px 64px}}
h1{{margin:0;font-size:28px;letter-spacing:-.02em}}.lead{{margin:6px 0 28px;color:#555;max-width:75ch}}
.opt{{margin-bottom:28px;padding:22px;border-radius:24px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 12px 30px -20px rgba(0,0,0,.25)}}
.opt h2{{display:flex;gap:12px;align-items:center;margin:0;font-size:22px}}.opt h2 span{{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#141414;color:#fff;font-size:14px}}
.w{{margin:2px 0 16px 44px;color:#666}}
.frames{{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px}}
.fd{{flex:none;width:720px;height:450px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.08)}}.fd iframe{{width:1440px;height:900px;border:0;transform:scale(.5);transform-origin:0 0;pointer-events:none}}
.fp{{flex:none;width:211px;height:456px;border-radius:26px;overflow:hidden;box-shadow:0 0 0 6px #141414}}.fp iframe{{width:390px;height:844px;border:0;transform:scale(.54);transform-origin:0 0;pointer-events:none}}
.frames>div{{margin:6px}}
.meta{{display:grid;gap:8px;margin-top:14px;max-width:80ch}}.meta p{{margin:0}}.chips{{display:flex;gap:6px;margin:0;padding:0;list-style:none}}.chips li{{width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}}
.f{{color:#555;font-size:14px}}.r{{color:#555;font-size:14px}}.meta a{{color:#0a5ae0;font-weight:600}}
</style></head><body><main><h1>FINN design options</h1>
<p class="lead">Five directions, all in liquid glass with rounded corners. Each shows the Home feed on a laptop (two panes: the list, and the open alert) and on a phone (the feed, then the alert as a full sheet). Real data: the 7-day feed and the OLAELEC results alert as of 14 Nov, 23:23 IST. The price line in the chart is illustrative; its end values are real.</p>
{cards}</main></body></html>""", encoding="utf-8")
print("ok")
