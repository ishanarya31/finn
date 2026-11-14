import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CATEGORIES, DEFAULT_RULES, getFeed, parseRules, type Cat } from "../../lib/finn";
import { getPortfolio, getRules } from "../ui";
import { Threshold } from "./threshold";

async function save(fd: FormData) {
  "use server";
  // parseRules clamps the numbers and drops unknown categories
  const rules = parseRules(JSON.stringify({ price: fd.get("price"), vol: fd.get("vol"), types: fd.getAll("types") }));
  (await cookies()).set("finn_rules", JSON.stringify(rules), { maxAge: 31536000, path: "/", sameSite: "lax" });
  redirect("/");
}

async function reset() {
  "use server";
  (await cookies()).delete("finn_rules");
  redirect("/rules");
}

export default async function RulesPage() {
  const rules = await getRules();
  const portfolio = await getPortfolio();
  const { items, days, now } = await getFeed(rules, portfolio);
  const since = now - 30 * 86400e3;
  const recent = Object.entries(days).flatMap(([s, d]) => d.filter((x) => x.ts >= since).map((x) => ({ s, x })));
  const count = (c: Cat) => items.filter((i) => i.cat === c).length;
  const same = (r: typeof rules) => JSON.stringify([r.price, r.vol, [...r.types].sort()]);
  const isDefault = same(rules) === same(DEFAULT_RULES); // saved types arrive in form order, so compare sorted

  return (
    <form action={save}>
      <Link href="/" className="back">
        <svg className="ic" aria-hidden="true">
          <use href="#i-back" />
        </svg>
        Feed
      </Link>
      <header className="r-lede">
        <h1>You decide what counts as unusual.</h1>
        <p>These rules apply to all {portfolio.length} companies in your portfolio. Whether a rule fired is arithmetic on end-of-day prices; no model is involved.</p>
      </header>

      <Threshold
        name="price"
        label="Price move in one day"
        hint="Close against the previous close"
        before="±"
        after="%"
        step={0.5}
        min={0.5}
        max={50}
        initial={rules.price}
        values={recent.map(({ s, x }) => ({ s, v: Math.abs(x.pct) }))}
      />
      <Threshold
        name="vol"
        label="Volume against the 20-day average"
        hint="The 20-day period is fixed"
        before=""
        after="×"
        step={0.1}
        min={1.1}
        max={20}
        initial={rules.vol}
        values={recent.map(({ s, x }) => ({ s, v: x.mult }))}
      />

      <div className="types" role="group" aria-labelledby="types-h">
        <p className="types-h" id="types-h">
          Announcement types that raise an alert
          <small>Unticked types show as minor or stay hidden. On the right: events in the last 30 days.</small>
        </p>
        <ul>
          {(Object.keys(CATEGORIES) as Cat[]).map((c) => (
            <li key={c}>
              <label>
                <input type="checkbox" name="types" value={c} defaultChecked={rules.types.includes(c)} />
                <span>{CATEGORIES[c]}</span>
                <span className="m">{count(c)}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <p className="note">Not in this draft: setting a rule by typing a sentence, and rules for a single stock.</p>
      {/* last in the form, so it sits flush on the pane's bottom edge even at the end of the scroll */}
      <div className="acts">
        <button className="btn">Save rules</button>
        {!isDefault && (
          <button className="btn ghost" formAction={reset} formNoValidate>
            Reset to defaults
          </button>
        )}
      </div>
    </form>
  );
}
