import { MODULE_ID } from "../constants.js";
import { getSystem } from "../systems/index.js";

async function callGemini(apiKey, model, schemaPrompt, description) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${schemaPrompt}\n\nNPC description: ${description}` }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callOpenAI(apiKey, model, schemaPrompt, description) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: schemaPrompt },
        { role: "user", content: `NPC description: ${description}` }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

/** @returns {Promise<object>} parsed NPC spec, shaped by the active game system's schema */
export async function generateNpcSpec(description) {
  const system = getSystem();
  const provider = game.settings.get(MODULE_ID, "provider");
  const apiKey = game.settings.get(MODULE_ID, "apiKey");
  const model = game.settings.get(MODULE_ID, "model");
  if (!apiKey) throw new Error(game.i18n.localize("NAB.Error.NoApiKey"));

  const raw = provider === "openai"
    ? await callOpenAI(apiKey, model, system.schemaPrompt, description)
    : await callGemini(apiKey, model, system.schemaPrompt, description);

  if (!raw) throw new Error(game.i18n.localize("NAB.Error.EmptyResponse"));
  const cleaned = raw.trim().replace(/^```json\s*|```$/g, "");
  return JSON.parse(cleaned);
}
