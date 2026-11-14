import "./globals.css";
import { Azeret_Mono, Hanken_Grotesk } from "next/font/google";
import { TopBar } from "./shell";

const ui = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--f-ui" });
const mono = Azeret_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-num" });

export const metadata = { title: "FINN", description: "What changed in your holdings. The rest, filtered out." };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0a1021" };

// Icons used across the app.
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 5.5l6.5 6.5L9 18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5.5L8.5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-out" viewBox="0 0 24 24"><path d="M8 16L16.5 7.5M9.5 7.5h7v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M12 19V5.5M6 11.5l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-feed" viewBox="0 0 24 24"><path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-port" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 7V5.5h6V7" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
<symbol id="i-rules" viewBox="0 0 24 24"><path d="M5 7.5h8M17 7.5h2M5 16.5h2M11 16.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15" cy="7.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="16.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
</svg>`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${mono.variable}`}>
      <body>
        <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: SPRITE }} />
        <div className="bg" aria-hidden="true" />
        <TopBar />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
