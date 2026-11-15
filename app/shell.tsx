"use client";
// The glass pieces that need the browser: the top bar, segmented controls with a sliding thumb, and scroll panes whose
// edges fade only where there is more to scroll (PRD 5.6).
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

const Icon = ({ n }: { n: string }) => (
  <svg className="ic" aria-hidden="true">
    <use href={`#i-${n}`} />
  </svg>
);

// A sliding thumb under the current item of a .seg-host: [aria-current] links (nav, window picker) or
// [aria-selected="true"] buttons (company tabs). Returns seat(), which can also move it to a clicked item early.
export function useThumb(ref: React.RefObject<HTMLElement | null>) {
  const seat = (to?: HTMLElement | null) => {
    const host = ref.current;
    const t = host?.querySelector<HTMLElement>(".thumb");
    const a = to ?? host?.querySelector<HTMLElement>('[aria-current], [aria-selected="true"]');
    if (!host || !t) return;
    t.style.opacity = a ? "1" : "0";
    if (a) {
      // Sized to the item, not the bar, so the thumb sits inside the bar's padding and its ends follow the bar's curve.
      // Sub-pixel rects: offsetWidth rounds, which left the thumb's end a pixel off the bar's curve.
      const r = a.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      t.style.width = `${r.width}px`;
      t.style.height = `${r.height}px`;
      t.style.transform = `translate(${r.left - h.left - host.clientLeft}px, ${r.top - h.top - host.clientTop}px)`;
    }
  };
  useLayoutEffect(() => seat()); // after every render: the current item may have changed
  useEffect(() => {
    const f = () => seat();
    addEventListener("resize", f);
    document.fonts?.ready.then(f);
    return () => removeEventListener("resize", f);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seat reads the ref at call time
  }, []);
  return seat;
}

// The window picker and nav: the thumb slides on a click before the server answers, then settles on what it marked current.
export function Seg({ className = "", label, children }: { className?: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const seat = useThumb(ref);
  return (
    <nav ref={ref} className={`seg-host ${className}`} aria-label={label} onClick={(e) => seat((e.target as HTMLElement).closest("a"))}>
      <span className="thumb" aria-hidden="true" />
      {children}
    </nav>
  );
}

// A scroll pane. data-up / data-down drive the fading mask; data attributes, so React's className is left alone.
export function Fade({ className = "", children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const f = () => {
      el.toggleAttribute("data-up", el.scrollTop > 4);
      el.toggleAttribute("data-down", el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };
    f();
    el.addEventListener("scroll", f, { passive: true });
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", f);
      ro.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={`fade ${className}`} {...rest}>
      {children}
    </div>
  );
}

const NAV = [
  ["/", "Feed", "feed"],
  ["/search", "Search", "search"],
  ["/portfolio", "Portfolio", "port"],
  ["/rules", "Rules", "rules"],
] as const;

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const on = (href: string) => (href === "/" ? path === "/" || path.startsWith("/alert") : path.startsWith(href) || (href === "/search" && path.startsWith("/company")));

  useEffect(() => {
    // "/" goes to search from anywhere; on the search page it focuses the box.
    const k = (e: KeyboardEvent) => {
      if (e.key !== "/" || (e.target as HTMLElement).matches("input, textarea")) return;
      e.preventDefault();
      const box = document.querySelector<HTMLInputElement>(".sbox input");
      if (box) box.focus();
      else router.push("/search");
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [router]);

  useEffect(() => {
    // Phone: the bar slides away while you scroll down and returns the moment you scroll up (only the window scrolls
    // there; on a desktop the panes scroll and the bar stays). Small jitters are ignored.
    const root = document.documentElement;
    const phone = matchMedia("(max-width: 979px)");
    let last = scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = scrollY;
      const d = y - last;
      if (!phone.matches || y < 8) root.removeAttribute("data-bar-hidden");
      else if (d > 2) root.setAttribute("data-bar-hidden", "");
      else if (d < -2) root.removeAttribute("data-bar-hidden");
      else return; // keep `last` until the move is big enough to count
      last = y;
    };
    const onScroll = () => {
      if (!ticking) requestAnimationFrame(update);
      ticking = true;
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      root.removeAttribute("data-bar-hidden");
    };
  }, []);
  // A new page starts with the bar shown.
  useEffect(() => document.documentElement.removeAttribute("data-bar-hidden"), [path]);

  return (
    <header className="top">
      <Link className="mark" href="/" aria-label="FINN home">
        FINN
      </Link>
      {/* Not a field: a click takes you to the Search page, whose box opens focused, with suggestions under it. */}
      <Link
        className="find"
        href="/search"
        aria-current={path === "/search" ? "page" : undefined}
        onClick={(e) => {
          if (path !== "/search") return;
          e.preventDefault();
          document.querySelector<HTMLInputElement>(".sbox input")?.focus();
        }}
      >
        <Icon n="search" />
        <span className="ph">Search any NSE company</span>
        <kbd>/</kbd>
      </Link>
      <Seg className="nav" label="Main">
        {NAV.map(([href, label, icon]) => (
          <Link key={href} href={href} className={href === "/search" ? "n-search" : undefined} aria-current={on(href) ? "page" : undefined} title={label}>
            <Icon n={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </Seg>
    </header>
  );
}
