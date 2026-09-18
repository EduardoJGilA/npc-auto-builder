import { MODULE_ID } from "../constants.js";

const SCHEMA_PROMPT = `You are a D&D 5e NPC designer. Output ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:
{
  "name": string,
  "level": integer (1-20, approximate character level driving CR),
  "cr": number (challenge rating, e.g. 0.25, 0.5, 1, 2...),
  "size": "tiny"|"sm"|"med"|"lg"|"huge"|"grg",
  "type": string (creature type, e.g. "humanoid (goblin)"),
  "alignment": string,
  "abilities": { "str": int, "dex": int, "con": int, "int": int, "wis": int, "cha": int },
  "hp": integer,
  "ac": integer,
  "acFormula": string (short explanation, e.g. "leather armor + dex"),
  "speed": integer (feet),
  "skillProficiencies": string[] (dnd5e skill keys: acr,ani,arc,ath,dec,his,ins,itm,inv,med,nat,prc,prf,per,rel,slt,ste,sur),
  "saveProficiencies": string[] (ability keys: str,dex,con,int,wis,cha),
  "senses": string,
  "languages": string,
  "equipment": string[] (item names, weapons/armor/gear),
  "spells": string[] (spell names, empty if non-caster),
  "features": [{ "name": string, "description": string }] (class/racial features incl. things like Sneak Attack, Pack Tactics),
  "biography": string (2-3 sentences, personality/appearance)
}
Only output the JSON object.`;

async function callGemini(apiKey, model, description) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SCHEMA_PROMPT}\n\nNPC description: ${description}` }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callOpenAI(apiKey, model, description) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SCHEMA_PROMPT },
        { role: "user", content: `NPC description: ${description}` }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

/** @returns {Promise<object>} parsed NPC spec */
export async function generateNpcSpec(description) {
  const provider = game.settings.get(MODULE_ID, "provider");
  const apiKey = game.settings.get(MODULE_ID, "apiKey");
  const model = game.settings.get(MODULE_ID, "model");
  if (!apiKey) throw new Error(game.i18n.localize("NAB.Error.NoApiKey"));

  const raw = provider === "openai"
    ? await callOpenAI(apiKey, model, description)
    : await callGemini(apiKey, model, description);

  if (!raw) throw new Error(game.i18n.localize("NAB.Error.EmptyResponse"));
  const cleaned = raw.trim().replace(/^```json\s*|```$/g, "");
  return JSON.parse(cleaned);
}
