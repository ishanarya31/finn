import { cookies } from "next/headers";
import { fmtPct, inr, parsePortfolio, parseRules, type Day, type Results, type Rules } from "../lib/finn";

// One demo user, no accounts: rules live in a cookie. ponytail: move to the database with accounts.
export const getRules = async () => parseRules((await cookies()).get("finn_rules")?.value);
export const getPortfolio = async () => parsePortfolio((await cookies()).get("finn_pf")?.value);

export function Delta({ v, d = 0 }: { v: number | null; d?: number }) {
  return <span className={v == null ? "na" : v > 0 ? "up" : v < 0 ? "down" : ""}>{fmtPct(v, d)}</span>;
}

// The company header. One component, so an alert (Node 1) and the company page (Node 2) name a company the same way.
export function CompanyHead({ co, children }: { co: { symbol: string; name: string; industry?: string; price?: string; mcap?: string; pe?: string }; children?: React.ReactNode }) {
  const tidy = (s: string) => s.replace(/₹\s+/, "₹").replace(/\s*Cr\.?$/, " cr");
  const kv = [["Price", co.price && tidy(co.price)], ["M.cap", co.mcap && tidy(co.mcap)], ["P/E", co.pe]].filter(([, v]) => v);
  return (
    <header className="d-head">
      <span className="tk">{co.symbol}</span>
      <p className="co-name">
        {co.name}
        {co.industry && ` · ${co.industry}`}
      </p>
      {kv.length > 0 && (
        <dl className="kv num">
          {kv.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </header>
  );
}

export function ResultsTable({ r }: { r: Results }) {
  return (
    <table className="res">
      <thead>
        <tr>
          <th scope="col">₹ cr · {r.period}</th>
          <th scope="col">Qtr</th>
          <th scope="col">QoQ</th>
          <th scope="col">YoY</th>
        </tr>
      </thead>
      <tbody>
        {r.rows.map((x) => (
          <tr key={x.label}>
            <td>{x.label}</td>
            <td>{inr(x.cur)}</td>
            <td>
              <Delta v={x.qoq} />
            </td>
            <td>
              <Delta v={x.yoy} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MoveLine({ m, rules }: { m: Day; rules: Rules }) {
  return (
    <p className="mv">
      <span className={Math.abs(m.pct) >= rules.price ? "hit" : ""}>
        <em>Price</em>
        <Delta v={m.pct} d={1} />
      </span>
      <span className={m.mult >= rules.vol ? "hit" : ""}>
        <em>Volume</em>
        {m.mult.toFixed(1)}× 20-day avg
      </span>
    </p>
  );
}

// Five quarters side by side. Figures are screener's; the margin row is arithmetic on them.
export function QuartersTable({ q }: { q: { periods: string[]; rows: Record<string, number[]> } }) {
  const n = q.periods.length;
  const from = Math.max(0, n - 5);
  const rev = q.rows.Sales ?? q.rows.Revenue;
  const op = "Financing Profit" in q.rows ? undefined : q.rows["Operating Profit"]; // no EBITDA for lenders
  const rows: [string, (number | null)[] | undefined, boolean][] = [
    ["Revenue", rev, false],
    ["EBITDA", op, false],
    ["Margin %", rev && op && rev.map((r, i) => (r > 0 ? (op[i] / r) * 100 : null)), true],
    ["PBT", q.rows["Profit before tax"], false],
    ["PAT", q.rows["Net Profit"], false],
  ];
  return (
    <div className="scroll">
      <table className="res qt">
        <thead>
          <tr>
            <th scope="col"></th>
            {q.periods.slice(from).map((p) => (
              <th scope="col" key={p}>
                {p.replace(/ 20(\d\d)$/, " $1")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(
            ([label, v, pct]) =>
              v && (
                <tr key={label}>
                  <td>{label}</td>
                  {v.slice(from).map((x, i) => (
                    <td key={i}>{x == null || !Number.isFinite(x) ? "–" : pct ? x.toFixed(1) : inr(x)}</td>
                  ))}
                </tr>
              ),
          )}
        </tbody>
      </table>
    </div>
  );
}

// Snapshot tiles: one figure each, with the line that puts it in context. All from screener's tables.
export function Snapshot({ tiles }: { tiles: { label: string; value: string; note: string }[] }) {
  if (!tiles.length) return null;
  return (
    <dl className="tiles">
      {tiles.map((t) => (
        <div key={t.label}>
          <dt>{t.label}</dt>
          <dd className="num">{t.value.replace(/^₹-/, "−₹").replace(/-(?=\d)/g, "−") /* a loss reads −₹1,685 cr, not ₹−1,685 cr */}</dd>
          {t.note && <dd className="note">{t.note.replace(/-(?=\d)/g, "−")}</dd>}
        </div>
      ))}
    </dl>
  );
}

// Five fiscal years side by side.
export function FiveYears({ y }: { y: { periods: string[]; rows: [string, string[]][]; growth: string } | null }) {
  if (!y) return null;
  return (
    <div className="d-sec">
      <h2>
        Five years <small>₹ crore, fiscal years</small>
      </h2>
      <div className="scroll">
        <table className="res qt">
          <thead>
            <tr>
              <th scope="col"></th>
              {y.periods.map((p) => (
                <th scope="col" key={p}>
                  {p.replace(/^Mar 20/, "FY")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {y.rows.map(([label, cells]) => (
              <tr key={label}>
                <td>{label}</td>
                {cells.map((c, i) => (
                  <td key={i} className={c.startsWith("-") ? "down" : ""}>
                    {c.replace(/^-/, "−")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {y.growth && <p className="cap" style={{ marginTop: 10 }}>{y.growth}</p>}
    </div>
  );
}
