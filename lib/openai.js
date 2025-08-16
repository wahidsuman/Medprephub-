// /lib/openai.js
export async function askOpenAI({ system, user, model, max_tokens = 1200, temperature = 0.3 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const mdl = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: mdl,
      messages: [
        { role: "system", content: system || "You are a concise assistant." },
        { role: "user", content: user || "" },
      ],
      temperature,
      max_tokens,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || "OpenAI error";
    throw new Error(msg);
  }
  return (data.choices?.[0]?.message?.content || "").trim();
      }
