// Model calls. All answer in JSON; keys stay on the server.
//   bulk()     heavy lifting: DeepSeek flash with thinking off (2.5 s on a 21-page transcript in testing).
//              If DeepSeek fails, Gemini flash does the job, so a research page does not die with one provider.
//   deepseek() the same fast call, for structured jobs where code makes the decision afterwards.
//   think()    reasoning: DeepSeek flash with thinking on, for prose an investor reads.
// Measured 14 Nov: deepseek-v4-pro was 4 to 130 times slower with no better output on these jobs, and
// OpenRouter's free models succeeded once in five tries. DEEPSEEK_REASON_MODEL switches the reasoning model.

function parseJSON(s: string) {
  const t = s.replace(/```(?:json)?/g, "");
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("model did not return JSON");
  return JSON.parse(t.slice(a, b + 1));
}

async function call(url: string, key: string | undefined, body: object, ms: number) {
  if (!key) throw new Error("no key");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(ms),
    cache: "no-store", // results are cached by the callers, per document or question
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`);
  return parseJSON((await r.json()).choices[0].message.content ?? "");
}

const messages = (system: string, user: string) => [{ role: "system", content: system }, { role: "user", content: user }];
const DEEPSEEK = "https://api.deepseek.com/chat/completions";

export function deepseek(system: string, user: string, maxTokens = 900) {
  return call(
    DEEPSEEK,
    process.env.DEEP_SEEK_KEY,
    { model: process.env.DEEPSEEK_MODEL || "deepseek-flash", thinking: { type: "disabled" }, response_format: { type: "json_object" }, temperature: 0.1, max_tokens: maxTokens, messages: messages(system, user) },
    120000,
  );
}

export function think(system: string, user: string, maxTokens = 900) {
  return call(
    DEEPSEEK,
    process.env.DEEP_SEEK_KEY,
    // Thinking is billed against max_tokens, so leave room for it on top of the answer.
    { model: process.env.DEEPSEEK_REASON_MODEL || "deepseek-flash", response_format: { type: "json_object" }, max_tokens: maxTokens + 8000, messages: messages(system, user) },
    240000,
  );
}

export async function bulk(system: string, user: string, maxTokens = 900) {
  try {
    return await deepseek(system, user, maxTokens);
  } catch (e) {
    console.warn("deepseek failed, using gemini:", String(e));
    return call(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      process.env.GEMINI_KEY,
      { model: process.env.GEMINI_MODEL || "gemini-flash-latest", reasoning_effort: "low", response_format: { type: "json_object" }, max_tokens: maxTokens + 3000, messages: messages(system, user) },
      120000,
    );
  }
}
