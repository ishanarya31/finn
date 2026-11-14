# Option C, second pass ("Magnitude"), from the user's notes of 14 Nov:
# refractive top bar that adapts to screen size; a fixed canvas where only the lists scroll; the alert-count card
# fixed above a scrolling alert list; liquid-glass interactions; fading list edges; a readable day chart.
# Every alert's detail is transplanted from the running app (scratchpad/alerts/*.html), so each card opens its real page.
import re, html, pathlib, sys

OUT = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1])  # folder holding 1.html .. 13.html and urls.txt
sys.path.insert(0, str(OUT))
from build import ALERTS, MINOR, QUIET, HIDDEN  # same real feed as the first round

DAYS = [(8, "Sun"), (9, "Mon"), (10, "Tue"), (11, "Wed"), (12, "Thu"), (13, "Fri"), (14, "Sat")]
DOW = dict(DAYS)
when = lambda d: f"{DOW[d[0]]} {d[0]} Nov, {d[1]}"

ICONS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 5.5l6.5 6.5L9 18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5.5L8.5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-out" viewBox="0 0 24 24"><path d="M8 16L16.5 7.5M9.5 7.5h7v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M12 19V5.5M6 11.5l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-feed" viewBox="0 0 24 24"><path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-port" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 7V5.5h6V7" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
<symbol id="i-rules" viewBox="0 0 24 24"><path d="M5 7.5h8M17 7.5h2M5 16.5h2M11 16.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15" cy="7.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="16.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
</svg>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
<feImage id="refract-map" x="0" y="0" width="1200" height="56" preserveAspectRatio="none" result="map" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'%3E%3ClinearGradient id='x'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='.06' stop-color='%23800000'/%3E%3Cstop offset='.94' stop-color='%23800000'/%3E%3Cstop offset='1' stop-color='%23f00'/%3E%3C/linearGradient%3E%3ClinearGradient id='y' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='.28' stop-color='%23008000'/%3E%3Cstop offset='.72' stop-color='%23008000'/%3E%3Cstop offset='1' stop-color='%230f0'/%3E%3C/linearGradient%3E%3Crect width='100' height='100' fill='url(%23x)'/%3E%3Crect width='100' height='100' fill='url(%23y)' style='mix-blend-mode:screen'/%3E%3C/svg%3E"/>
<feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b"/><feDisplacementMap in="b" in2="map" scale="44" xChannelSelector="R" yChannelSelector="G"/></filter></svg>"""
ic = lambda n, c="ic": f'<svg class="{c}" aria-hidden="true"><use href="#i-{n}"/></svg>'

# ---------------------------------------------------------------- transplant the app's alert pages
def load():
    urls = (SRC / "urls.txt").read_text().split()
    out = {}
    for i, u in enumerate(urls, 1):
        s = (SRC / f"{i}.html").read_text(encoding="utf-8")
        a = s[s.rfind("<article"):]
        a = re.sub(r"<script.*?</script>|<!--.*?-->", "", a, flags=re.S)
        g = lambda p: re.search(p, a, re.S).group(1)
        d = dict(id=u.split("/alert/")[1].split("?")[0], tk=g(r'class="tk">([^<]+)'), co=g(r'class="co-name">([^<]+)'),
                 kv=re.findall(r"<dt>([^<]+)</dt><dd>([^<]+)</dd>", g(r'<dl class="kv num">(.*?)</dl>')),
                 cat=g(r'class="cat">([^<]+)'), when=g(r'class="when"[^>]*>([^<]+)'))
        secs = re.findall(r'<section class="d-sec"><h2>([^<]+)</h2>(.*?)</section>', a, re.S)
        body = []
        for h, x in secs:
            x = x.replace(" ↗", "")
            x = re.sub(r'<div class="rg".*?</div>', '<span class="rng">3M</span>', x, flags=re.S)
            x = re.sub(r'(<polyline points="([^"]+)")', lambda m: f'<polygon class="area" points="0,100 {m.group(2)} 100,100"/>{m.group(1)}', x)
            x = re.sub(r'(<span class="t">[^<]*</span><span class="m">[^<]*</span>)</a>', r'\1' + ic("out") + "</a>", x)
            x = x.replace('<div class="plot" style="opacity:1">', '<div class="plot"><i class="hair" hidden></i><span class="tip num" hidden></span>')
            body.append(f'<section class="sec"><h3>{h}</h3>{x}</section>')
        d["body"] = "".join(body)
        out[(d["tk"], d["cat"], d["id"])] = d
    return out

DET = load()
def detail_for(sym, cat, day):
    key = {"M&amp;A": "mna", "Management change": "management_change", "Fund raise": "fund_raise", "Unusual move": "move", "Results": "results"}[cat]
    for (tk, _, i), d in DET.items():
        if tk == sym and f"-{key}-" in f"{i}-" and (key == "results" or i.endswith(f"-{day:02d}")):
            return d
    raise KeyError((sym, cat, day))

def detail_html(d, first):
    kv = "".join(f"<div><dt>{k}</dt><dd class=num>{v}</dd></div>" for k, v in d["kv"])
    return f"""<article class="detail{' on' if first else ''}" id="{d['id']}" aria-label="{d['tk']} alert" {'' if first else 'hidden'}>
<div class="dscroll fade"><button class="back" type="button">{ic("back")}Feed</button>
<header class="dh"><div><h2 class="dtk">{d['tk']}</h2><p class="co">{d['co']}</p></div><dl class="facts">{kv}</dl>
<p class="badge"><span class="pill">{d['cat']}</span><time>{d['when']}</time></p></header>
{d['body']}
<a class="research" href="#"><span><b>Research {d['tk']}</b><small>Promised vs delivered, the numbers, and questions answered from its filings</small></span>{ic("chev")}</a></div>
<form class="ask" onsubmit="return false"><input placeholder="Ask Finn about {d['tk']}" aria-label="Ask Finn about {d['tk']}"><button aria-label="Send question">{ic("send")}</button></form></article>"""

# ---------------------------------------------------------------- summary: alert count by type; a chip filters the list
def summary():
    n = {}
    for a in ALERTS:
        n[a[1]] = n.get(a[1], 0) + 1
    chips = "".join(f'<button type="button" data-cat="{c}" aria-pressed="false">{c}<b class="num">{k}</b></button>' for c, k in n.items())
    return f'<div class="types" role="group" aria-label="Filter alerts by type"><button type="button" data-cat="" aria-pressed="true">All<b class="num">{len(ALERTS)}</b></button>{chips}</div>'

def page():
    firsts, cards, details = True, [], []
    for i, (s, c, d, ln, ft) in enumerate(ALERTS):
        det = detail_for(s, c, d[0])
        details.append(detail_html(det, i == 0))
        mag = "m1" if c == "Results" else "m3" if c == "Unusual move" else "m2"
        cards.append(f'<a class="card {mag}{" on" if i == 0 else ""}" href="#{det["id"]}" data-id="{det["id"]}" data-day="{d[0]}" data-cat="{c}" style="--i:{i}">'
                     f'<span class="mag" aria-hidden="true"></span><div class="ch"><span class="tk">{s}</span><span class="cat">{c}</span><time>{when(d)}</time></div>'
                     f'<p class="ln">{ln}</p>{f"<p class=ft>{ft}</p>" if ft else ""}</a>')
    rows = lambda rs: "".join(f'<li data-day="{d[0]}"><span class="tk">{s}</span><span class="tx">{x}</span><time>{when(d)}</time></li>' for s, x, d in rs)
    quiet = "".join(f'<li><span class="tk">{s}</span><span class="num {"up" if p > 0 else "down" if p < 0 else ""}">{"+" if p > 0 else "−" if p < 0 else ""}{abs(p):.1f}%</span></li>' for s, p in QUIET)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>FINN · Magnitude</title><meta name="theme-color" content="#0a1021"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Azeret+Mono:wght@400;500;600&display=swap" rel="stylesheet"><style>{CSS}</style></head>
<body>{ICONS}<div class="bg" aria-hidden="true"></div>
<header class="top"><a class="mark" href="#" aria-label="FINN home">FINN</a>
<label class="find">{ic("search")}<input placeholder="Search any NSE company" aria-label="Search any NSE company"><kbd>/</kbd></label>
<nav class="nav seg-host" aria-label="Main"><span class="thumb" aria-hidden="true"></span><a href="#" aria-current="page" title="Feed">{ic("feed")}<span>Feed</span></a><a href="#" class="n-search" title="Search">{ic("search")}<span>Search</span></a><a href="#" title="Portfolio">{ic("port")}<span>Portfolio</span></a><a href="#" title="Rules">{ic("rules")}<span>Rules</span></a></nav></header>
<main class="shell">
<section class="left" aria-label="Feed">
<div class="lede glass"><div class="lt"><h1><span class="n num">13</span><span>alerts need review</span></h1>
<p class="sub">Last 7 days · <b class="num">7</b> minor · <b class="num">20</b> routine filings hidden · <b class="num">9</b> of 18 holdings quiet</p></div>
{summary()}
<nav class="win seg-host" aria-label="Time window"><span class="thumb" aria-hidden="true"></span><a href="#">24h</a><a href="#">3d</a><a href="#" aria-current="true">7d</a><a href="#">Custom</a></nav></div>
<div class="lscroll fade" tabindex="-1">
<h2 class="sh">Alerts <span class="c num">13</span><span class="hint"><kbd>J</kbd><kbd>K</kbd> to move</span></h2>
<div class="alerts">{''.join(cards)}</div>
<h2 class="sh">Minor <span class="c num">7</span><span class="d">worth a glance; tap opens the filing</span></h2><ul class="rows glass">{rows(MINOR)}</ul>
<details class="fold glass"><summary>Quiet holdings <span class="c num">9</span><span class="d">nothing material; last session's change</span>{ic("chev","ic chev")}</summary><ul class="quiet">{quiet}</ul></details>
<details class="fold glass hid"><summary>Hidden <span class="c num">20</span><span class="d">routine filings, kept for the record</span>{ic("chev","ic chev")}</summary><ul class="rows">{rows(HIDDEN)}</ul></details>
<p class="foot">Filings: NSE. Prices: Yahoo Finance, end of day. Results: screener.in. Read Sat 14 Nov, 23:23 IST.</p>
</div></section>
<section class="right glass" aria-label="Alert detail">{''.join(details)}</section>
</main><script>{JS}</script></body></html>"""

CSS = r"""
:root{color-scheme:dark;--f-ui:"Hanken Grotesk",system-ui,sans-serif;--f-num:"Azeret Mono",ui-monospace,monospace;
 --ground:#0a1021;--ground2:#111a33;--ink:#f0efe6;--ink2:#a3aecb;--ink3:#8191b8;--accent:#ff5a3c;--accent-ink:#1a0a05;--accent-text:#ff8a70;--up:#6fd69b;--down:#ff8a75;
 --pane:rgba(20,32,60,.55);--pane-brd:rgba(160,185,240,.15);--pane-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 24px 60px -24px rgba(0,0,0,.75);
 --r:24px;--well:rgba(160,185,240,.07);--well2:rgba(160,185,240,.13);--line:rgba(160,185,240,.11);
 --b-a:#ff5a3c;--b-m:#c9d3ee;--b-h:#6a7cab;--ease:cubic-bezier(.16,1,.3,1);--spring:cubic-bezier(.34,1.4,.64,1);--topH:60px}
*{box-sizing:border-box}[hidden]{display:none!important}html{-webkit-text-size-adjust:100%}
body{margin:0;color:var(--ink);background:var(--ground);font:400 15px/1.45 var(--f-ui);-webkit-font-smoothing:antialiased}
h1,h2,h3,p,ul,ol,dl,dd,figure{margin:0;padding:0}ul,ol{list-style:none}a{color:inherit;text-decoration:none}button{font:inherit;color:inherit}
::selection{background:rgba(255,90,60,.4);color:#fff}:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:10px}
*{scrollbar-width:thin;scrollbar-color:rgba(160,185,240,.22) transparent}
.num,time{font-variant-numeric:tabular-nums}.up{color:var(--up)}.down{color:var(--down)}.na{color:var(--ink2)}
.ic{width:18px;height:18px;flex:none}
kbd{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:6px;font:600 11px/1 var(--f-num);color:var(--ink2);background:var(--well2);box-shadow:inset 0 -1px 0 rgba(0,0,0,.3)}
/* sky */
.bg{position:fixed;inset:0;z-index:-1;pointer-events:none;
 background:radial-gradient(1000px 240px at 55% 0,rgba(90,115,190,.22),transparent 70%),
 radial-gradient(900px 600px at 85% 30%,#18284e 0,transparent 65%),radial-gradient(700px 500px at 5% 95%,#15213b 0,transparent 65%),#0a1021}
.bg::after{content:"";position:absolute;inset:0;opacity:.3;background-image:radial-gradient(1px 1px at 20px 30px,#fff9,transparent),radial-gradient(1px 1px at 120px 80px,#fff7,transparent),radial-gradient(1.6px 1.6px at 200px 150px,#fffc,transparent),radial-gradient(1px 1px at 60px 190px,#fff6,transparent),radial-gradient(1.2px 1.2px at 170px 20px,#fff9,transparent),radial-gradient(1px 1px at 240px 230px,#fff5,transparent),radial-gradient(1.4px 1.4px at 90px 120px,#ffd9c8aa,transparent);background-size:260px 260px}
/* glass */
.glass{position:relative;background:var(--pane);border:1px solid var(--pane-brd);border-radius:var(--r);box-shadow:var(--pane-shadow);-webkit-backdrop-filter:blur(22px) saturate(1.3);backdrop-filter:blur(22px) saturate(1.3)}
/* top bar: clear, refractive glass, little frost; fixed at every width */
body{padding-top:calc(var(--topH) + 12px)}
.top{position:fixed;top:12px;left:16px;right:16px;z-index:40;display:flex;align-items:center;gap:12px;height:var(--topH);padding:0 8px 0 6px;border-radius:999px;isolation:isolate}
.top::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;
 background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02) 55%,rgba(255,255,255,.05));
 -webkit-backdrop-filter:blur(3px) saturate(1.9) brightness(1.18);backdrop-filter:blur(3px) saturate(1.9) brightness(1.18);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.42),inset 0 -1px 0 rgba(255,255,255,.12),inset 1px 0 0 rgba(255,255,255,.14),inset -1px 0 0 rgba(255,255,255,.14),
  inset 0 0 22px rgba(170,195,255,.14),0 14px 34px -14px rgba(0,0,0,.7)}
@media (min-width:980px){.refract .top::before{-webkit-backdrop-filter:url(#refract) saturate(1.9) brightness(1.2);backdrop-filter:url(#refract) saturate(1.9) brightness(1.2)}}
.mark{padding:0 14px;font-weight:800;font-size:18px;letter-spacing:.18em;color:#fff}
.find{display:flex;align-items:center;gap:8px;flex:1;max-width:420px;height:42px;padding:0 10px 0 14px;border-radius:999px;color:var(--ink2);
 background:rgba(255,255,255,.06);box-shadow:inset 0 1px 2px rgba(0,0,0,.35),inset 0 -1px 0 rgba(255,255,255,.08);transition:max-width .5s var(--ease),background .3s}
.find:focus-within{background:rgba(255,255,255,.1)}
.find input{flex:1;min-width:0;border:0;background:none;font:inherit;color:var(--ink);outline:none}.find input::placeholder{color:var(--ink2)}
/* segmented controls with a sliding liquid thumb */
.seg-host{position:relative;display:flex}
.seg-host .thumb{position:absolute;top:0;left:0;height:100%;border-radius:999px;pointer-events:none;
 background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.07));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.14),0 6px 14px -6px rgba(0,0,0,.6);
 transition:transform .55s var(--spring),width .55s var(--spring)}
.seg-host.moving .thumb{animation:squish .55s var(--ease)}
@keyframes squish{40%{scale:1.08 .86}}
.seg-host a{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:999px;color:var(--ink2);font-weight:600;transition:color .3s}
.seg-host a:hover{color:var(--ink)}.seg-host a[aria-current]{color:#fff}
.nav{margin-left:auto;gap:2px;padding:4px;border-radius:999px}.nav a{height:42px;padding:0 16px}.nav .n-search{display:none}
/* canvas: fixed height; only the lists scroll */
.shell{display:grid;gap:16px;padding:16px}
@media (min-width:980px){
 body{height:100dvh;overflow:hidden;display:flex;flex-direction:column}
 .shell{flex:1;min-height:0;grid-template-columns:minmax(360px,440px) minmax(0,1fr)}
 .left{display:flex;flex-direction:column;gap:12px;min-height:0}
 .lscroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:2px 4px 16px 2px;margin:0 -4px 0 -2px}
 .right{min-height:0;display:flex;overflow:hidden}
 .detail{flex:1;min-width:0;display:flex;flex-direction:column}
 .dscroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:28px 32px 20px}
}
/* fading edges: shown only when there is more to scroll in that direction */
.fade{--ft:0px;--fb:0px;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 var(--ft),#000 calc(100% - var(--fb)),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 var(--ft),#000 calc(100% - var(--fb)),transparent 100%)}
.fade.more-up{--ft:44px}.fade.more-down{--fb:56px}
@supports (animation-timeline:view()){
 .lscroll .card,.lscroll .rows li{animation:edge linear both;animation-timeline:view();animation-range:exit -20% exit 100%}
 @keyframes edge{to{opacity:.15;transform:scale(.96) translateY(-4px);filter:blur(1.5px)}}
}
/* lede: fixed at the top of the column */
.lede{padding:20px 20px 14px}
.lede h1{display:flex;align-items:baseline;gap:12px;font-size:22px;font-weight:650;letter-spacing:-.01em}
.lede .n{font-size:54px;line-height:.9;font-weight:600;letter-spacing:-.04em;color:#fff}
.sub{margin-top:8px;color:var(--ink2);font-size:13.5px}.sub b{color:var(--ink);font-weight:600}
.types{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.types button{display:flex;align-items:baseline;gap:7px;padding:7px 12px;border:0;border-radius:999px;background:var(--well);color:var(--ink2);font-size:13px;font-weight:600;cursor:pointer;transition:background .25s,color .25s}
.types button b{font-weight:600;color:var(--ink)}.types button:hover{background:var(--well2);color:var(--ink)}
.types button[aria-pressed="true"]{background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.win{margin-top:12px;padding:3px;border-radius:999px;background:var(--well)}.win a{flex:1;padding:8px 0;font-size:13.5px}
/* list */
.sh{display:flex;align-items:baseline;gap:8px;margin:18px 6px 8px;font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}
.sh:first-of-type{margin-top:6px}.c{font-weight:500;letter-spacing:0;color:var(--ink3)}
.sh .d{font-size:12px;font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink3)}
.hint{margin-left:auto;display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:500;letter-spacing:0;text-transform:none;color:var(--ink3)}
.alerts{display:flex;flex-direction:column;gap:8px}
.card{position:relative;display:grid;grid-template-columns:16px minmax(0,1fr);column-gap:12px;padding:14px 16px 14px 14px;border-radius:18px;
 background:rgba(22,35,64,.42);border:1px solid rgba(160,185,240,.11);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);
 transition:transform .5s var(--spring),background .3s,border-color .3s,box-shadow .4s,opacity .3s;overflow:hidden}
.card:hover{transform:translateY(-1px);border-color:rgba(160,185,240,.22)}
.card:active{transform:scale(.985);transition-duration:.15s}
.card.on{background:rgba(40,56,98,.72);border-color:rgba(255,110,80,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 16px 36px -18px rgba(0,0,0,.85),0 0 0 3px rgba(255,90,60,.12)}
.card[hidden]{display:none}
.mag{grid-row:1/4;align-self:start;justify-self:center;margin-top:4px;border-radius:50%;background:var(--accent)}
.m1 .mag{width:13px;height:13px;box-shadow:0 0 0 4px rgba(255,90,60,.2)}
.m2 .mag{width:10px;height:10px;margin-top:5px;box-shadow:0 0 0 3px rgba(255,90,60,.16)}
.m3 .mag{width:8px;height:8px;margin-top:6px;box-shadow:0 0 0 3px rgba(255,90,60,.12)}
.ch,.ln,.ft{grid-column:2}
.ch{display:flex;align-items:baseline;gap:8px;min-width:0}.tk{font-weight:700;letter-spacing:.02em}
.cat{font-size:12px;font-weight:600;color:#cbd4ee;padding:2px 8px;border-radius:999px;background:var(--well2);white-space:nowrap}
.ch time{margin-left:auto;font-size:12px;color:var(--ink2);white-space:nowrap}
.ln{margin-top:6px;font-size:14px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ln b{font-weight:600}
.ft{margin-top:5px;font-size:12.5px;color:var(--ink2)}
.rows{padding:4px 0;border-radius:18px}.rows li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:10px 16px;font-size:13.5px}
.rows li+li{border-top:1px solid var(--line)}.rows li[hidden]{display:none}.rows .tx{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--ink2)}.rows time{font-size:12px;color:var(--ink3)}
.fold{margin-top:10px;border-radius:18px}.fold summary{display:flex;align-items:baseline;gap:8px;padding:14px 16px;cursor:pointer;list-style:none;font-weight:650}.fold summary::-webkit-details-marker{display:none}
.fold .d{color:var(--ink3);font-weight:400;font-size:12.5px}.fold .chev{margin-left:auto;align-self:center;transition:transform .35s var(--spring);color:var(--ink2)}.fold[open] .chev{transform:rotate(90deg)}
.quiet{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;padding:0 12px 14px}
.quiet li{display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:var(--well);font-size:13px}
.hid .tx{text-decoration:line-through;text-decoration-color:var(--ink3)}
.foot{margin:14px 6px 0;font-size:12px;color:var(--ink3)}
/* detail */
.detail[hidden]{display:none!important}
.detail.enter .dscroll>*{animation:din .5s var(--ease) both}.detail.enter .dscroll>*:nth-child(n+3){animation-delay:.05s}.detail.enter .dscroll>*:nth-child(n+4){animation-delay:.09s}
@keyframes din{from{opacity:0;transform:translateY(10px);filter:blur(4px)}}
.back{display:none;align-items:center;gap:4px;margin:0 0 12px -6px;padding:6px 10px 6px 4px;border:0;border-radius:999px;background:none;font-weight:600;color:var(--accent-text);cursor:pointer}
.dh{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 24px;align-items:end;padding-bottom:18px;border-bottom:1px solid var(--line)}
.dtk{font-size:32px;font-weight:700;letter-spacing:-.01em}.co{color:var(--ink2);margin-top:2px}
.facts{display:flex;gap:24px}.facts dt{font-size:12px;color:var(--ink2)}.facts dd{font-size:18px;font-weight:600}
.badge{grid-column:1/-1;display:flex;gap:10px;align-items:center;margin-top:8px;font-size:13px}.badge time{color:var(--ink2)}
.pill{padding:4px 11px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:700;box-shadow:0 6px 14px -6px rgba(0,0,0,.6)}
.sec{padding:22px 0;border-bottom:1px solid var(--line)}
.sec h3{margin-bottom:10px;font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}
.fact,.prose{max-width:68ch}.prose{font-size:16px;line-height:1.55}
.res{width:100%;max-width:560px;margin-top:14px;border-collapse:collapse;font-size:14px}
.res th,.res td{padding:9px 0;text-align:right;border-bottom:1px solid var(--line);font-weight:500}.res tr>:first-child{text-align:left;font-weight:600}
.res td{font-family:var(--f-num);font-size:13.5px}.res tr>td:first-child{font-family:var(--f-ui);font-size:14px}.res thead th{font-size:12px;color:var(--ink2);font-weight:600}
.res tbody tr{transition:background .2s}.res tbody tr:hover{background:var(--well)}
.mv{display:flex;flex-wrap:wrap;gap:8px}.res+.mv{margin-top:16px}
.mv>span{display:flex;flex-direction:column;gap:2px;min-width:150px;padding:12px 16px;border-radius:16px;background:var(--well);font-size:20px;font-weight:600}
.mv>span em{font-style:normal;font-size:12px;font-weight:600;color:var(--ink2)}
.mv>.hit{box-shadow:inset 0 0 0 1px rgba(255,110,80,.5)}.mv>.hit::after{content:"Crossed your rule";font-size:11.5px;font-weight:600;color:var(--accent-text)}
.mv>span:not(.hit)::after{content:"Within your rule";font-size:11.5px;font-weight:500;color:var(--ink3)}
.mv+.cap{margin-top:10px;font-size:13px;color:var(--ink2)}
.facts li,.sec .facts{display:block}.sec ul.facts{display:grid;gap:6px;margin-top:12px;font-size:14px;color:var(--ink2)}.sec ul.facts b{color:var(--ink);font-weight:600}
.checks{counter-reset:n;display:grid;gap:8px}.checks li{counter-increment:n;display:flex;gap:12px;align-items:baseline;padding:12px 14px;border-radius:14px;background:var(--well)}
.checks li::before{content:counter(n);font:600 12px/1 var(--f-num);color:var(--accent-text)}
.src{display:grid;gap:2px}.src a,.src .nolink{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:0 -12px;border-radius:12px;transition:background .2s}.src a:hover{background:var(--well2)}
.src .t{font-weight:600}.src .m{margin-left:auto;color:var(--ink2);font-size:12px;font-variant-numeric:tabular-nums}.src .ic{color:var(--ink2);width:16px;height:16px}
/* price chart, from the app's own series */
.chart{margin-top:16px;padding:16px 16px 12px;border-radius:18px;background:var(--well)}
.chart-top{display:flex;justify-content:space-between;align-items:center}.chart-read b{font-size:20px;font-weight:600}.chart-read span{color:var(--ink2);font-size:13px}
.rng{padding:4px 10px;border-radius:999px;background:var(--well2);font-size:12px;font-weight:600;color:var(--ink2)}
.plot-wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:190px auto;gap:6px 12px;margin-top:14px}
.plot{position:relative;color:var(--ink);cursor:crosshair}
.plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.plot polyline{stroke-width:2}.plot .area{fill:rgba(240,239,230,.06)}
.gl{position:absolute;left:0;right:0;border-top:1px dashed var(--line)}
.vl{position:absolute;top:0;bottom:0;border-left:1.5px dashed var(--accent)}
.dot{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--ground2)}
.hair{position:absolute;top:0;bottom:0;border-left:1px solid rgba(240,239,230,.5);pointer-events:none}
.tip{position:absolute;top:-6px;transform:translate(-50%,-100%);padding:4px 8px;border-radius:8px;background:rgba(10,16,33,.92);box-shadow:0 0 0 1px var(--pane-brd);font-size:12px;white-space:nowrap;pointer-events:none}
.yl{display:flex;flex-direction:column;justify-content:space-between;font:500 11.5px var(--f-num);color:var(--ink2)}
.xl{display:flex;justify-content:space-between;font:500 11.5px var(--f-num);color:var(--ink2)}
.chart .cap{margin-top:8px;font-size:12.5px;color:var(--ink2)}
.research{position:relative;display:flex;align-items:center;gap:12px;margin:22px 0 4px;padding:18px 20px;border-radius:18px;background:linear-gradient(180deg,rgba(255,110,80,.2),rgba(255,90,60,.1));box-shadow:inset 0 0 0 1px rgba(255,110,80,.4);transition:transform .45s var(--spring)}
.research:hover{transform:translateY(-1px)}.research span{flex:1;display:grid;gap:2px}.research small{color:var(--ink2)}
.ask{display:flex;align-items:center;gap:8px;margin:0 20px 18px;padding:6px 6px 6px 18px;border-radius:999px;background:rgba(14,22,44,.7);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px var(--pane-brd),0 12px 30px -12px rgba(0,0,0,.8);-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5)}
.ask input{flex:1;min-width:0;border:0;background:none;font:inherit;color:var(--ink);outline:none;height:42px}.ask input::placeholder{color:var(--ink2)}
.ask button{display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:var(--accent);color:var(--accent-ink);cursor:pointer;transition:transform .4s var(--spring)}
.ask button:hover{transform:scale(1.06)}
/* mid widths: search folds into a button that opens on focus; nav keeps icons */
@media (min-width:980px) and (max-width:1239px){
 .find{flex:0 0 auto;max-width:42px;padding:0 12px;cursor:pointer}.find kbd{display:none}.find input{width:0}
 .find:focus-within{max-width:300px;flex:1}.find:focus-within input{width:auto}
 .nav a{padding:0 12px}.hint{display:none}
}
@media (min-width:980px) and (max-width:1099px){.nav a span{display:none}.nav a{width:46px;padding:0}}
/* phone and tablet: the page scrolls, the count card stays pinned, the alert opens as a sheet */
@media (max-width:979px){
 body{padding-top:calc(62px + env(safe-area-inset-top))}
 .top{top:max(8px,env(safe-area-inset-top));left:10px;right:10px;height:54px}.find{display:none}.hint{display:none}
 .top::before{background:rgba(12,18,36,.8);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6)}
 .nav{position:fixed;z-index:15;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));justify-content:space-around;margin:0;padding:5px;
  background:rgba(14,22,44,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1px rgba(255,255,255,.08),0 16px 34px -12px rgba(0,0,0,.8);-webkit-backdrop-filter:blur(6px) saturate(1.9) brightness(1.15);backdrop-filter:blur(6px) saturate(1.9) brightness(1.15)}
 .nav a{flex:1;flex-direction:column;gap:2px;height:52px;padding:0;font-size:11px}.nav .ic{width:20px;height:20px}.nav .n-search{display:flex}
 .shell{grid-template-columns:minmax(0,1fr);padding:12px 10px 100px}
 .lede{padding:16px 16px 12px}.lede .n{font-size:44px}.lede h1{font-size:19px}
 .lscroll{padding:0}.right{display:contents}
 .detail{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;background:rgba(9,14,30,.94);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px)}
 .detail:not(.open){display:none!important}.detail.open{animation:sheet .5s var(--ease)}
 .dscroll{flex:1;overflow:auto;padding:16px 16px 12px}.back{display:inline-flex}.dh{grid-template-columns:1fr}.ask{margin:0 10px max(10px,env(safe-area-inset-bottom))}
 body:has(.detail.open){overflow:hidden}body:has(.detail.open) .nav,body:has(.detail.open) .top{display:none}
 body::before{content:"";position:fixed;top:0;left:0;right:0;z-index:39;height:calc(36px + env(safe-area-inset-top));background:linear-gradient(var(--ground) 40%,transparent);pointer-events:none}
}
@keyframes sheet{from{transform:translateY(40px);opacity:0}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
"""

JS = r"""
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const phone=matchMedia('(max-width:979px)');
// Refraction through an SVG displacement map works in Chromium only; elsewhere the bar stays clear glass.
if(navigator.userAgentData){document.documentElement.classList.add('refract');
  const fit=()=>{const b=$('.top').getBoundingClientRect(),m=$('#refract-map');m.setAttribute('width',b.width);m.setAttribute('height',b.height)};fit();addEventListener('resize',fit)}
// sliding thumbs
function seat(host,anim){const a=$('[aria-current]',host),t=$('.thumb',host);if(!a||!t)return;t.style.width=a.offsetWidth+'px';t.style.transform=`translateX(${a.offsetLeft}px)`;
  if(anim){host.classList.remove('moving');void host.offsetWidth;host.classList.add('moving')}}
$$('.seg-host').forEach(h=>{h.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;e.preventDefault();$$('a',h).forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','true');seat(h,true)})});
const reseat=()=>$$('.seg-host').forEach(h=>seat(h));addEventListener('resize',reseat);document.fonts.ready.then(reseat);reseat();
// fading edges
function edges(el){const up=el.scrollTop>4,down=el.scrollTop+el.clientHeight<el.scrollHeight-4;el.classList.toggle('more-up',up);el.classList.toggle('more-down',down)}
$$('.fade').forEach(el=>{el.addEventListener('scroll',()=>edges(el),{passive:true});edges(el)});addEventListener('resize',()=>$$('.fade').forEach(edges));
// open an alert
const cards=$$('.card');
function open(id,{push=true,focus=false}={}){const d=document.getElementById(id);if(!d)return;
  $$('.detail').forEach(x=>{x.hidden=x!==d;x.classList.remove('open','enter')});cards.forEach(c=>c.classList.toggle('on',c.dataset.id===id));
  void d.offsetWidth;d.classList.add('enter');if(phone.matches)d.classList.add('open');
  const sc=$('.dscroll',d);sc.scrollTop=0;edges(sc);
  const c=cards.find(c=>c.dataset.id===id);if(c&&!phone.matches)c.scrollIntoView({block:'nearest',behavior:'smooth'});
  if(push)history.replaceState(null,'','#'+id);if(focus)c&&c.focus({preventScroll:true})}
cards.forEach(c=>c.addEventListener('click',e=>{e.preventDefault();open(c.dataset.id)}));
$$('.back').forEach(b=>b.addEventListener('click',()=>{$$('.detail').forEach(x=>x.classList.remove('open'));history.replaceState(null,'',location.pathname)}));
if(location.hash&&document.getElementById(location.hash.slice(1)))open(location.hash.slice(1),{push:false});
// J / K move through visible alerts, Enter opens, / searches, Esc closes the sheet
addEventListener('keydown',e=>{if(e.target.matches('input'))return;const vis=cards.filter(c=>!c.hidden),i=vis.findIndex(c=>c.classList.contains('on'));
  if(e.key==='j'||e.key==='ArrowDown'&&e.altKey){e.preventDefault();vis[Math.min(i+1,vis.length-1)]&&open(vis[Math.min(i+1,vis.length-1)].dataset.id,{focus:true})}
  if(e.key==='k'||e.key==='ArrowUp'&&e.altKey){e.preventDefault();vis[Math.max(i-1,0)]&&open(vis[Math.max(i-1,0)].dataset.id,{focus:true})}
  if(e.key==='/'){e.preventDefault();$('.find input').focus()}
  if(e.key==='Escape')$$('.detail').forEach(x=>x.classList.remove('open'))});
// type chips filter the alert list; "All" clears
const types=$$('.types button');
types.forEach(b=>b.addEventListener('click',()=>{types.forEach(x=>x.setAttribute('aria-pressed',x===b));const c=b.dataset.cat;
  cards.forEach(k=>k.hidden=!!c&&k.dataset.cat!==c);const f=cards.find(k=>!k.hidden);if(c&&f&&!phone.matches)open(f.dataset.id);$$('.fade').forEach(edges)}));
// price chart crosshair: value read back from the plotted series and the axis bounds
$$('.plot').forEach(p=>{const pl=$('polyline',p);if(!pl)return;const pts=pl.getAttribute('points').trim().split(/\s+/).map(s=>s.split(',').map(Number));
  const ys=$$('.yl span',p.parentNode).map(s=>+s.textContent.replace(/,/g,'')),hi=ys[0],lo=ys[ys.length-1],hair=$('.hair',p),t=$('.tip',p);
  const fmt=v=>'₹'+v.toLocaleString('en-IN',{maximumFractionDigits:v<100?2:0});
  p.addEventListener('pointermove',e=>{const r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100;let k=0;pts.forEach((q,i)=>{if(Math.abs(q[0]-x)<Math.abs(pts[k][0]-x))k=i});
    const [px,py]=pts[k];hair.hidden=t.hidden=false;hair.style.left=px+'%';t.style.left=px+'%';t.textContent='Close '+fmt(lo+(100-py)/100*(hi-lo))});
  p.addEventListener('pointerleave',()=>{hair.hidden=t.hidden=true})});
"""

(OUT / "c2.html").write_text(page(), encoding="utf-8")
print("ok", len(DET), "alerts")
