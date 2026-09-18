import { SKILL_ABILITY } from "../constants.js";

const SCHEMA_PROMPT = `You are an expert D&D 5e (2014 or 2024 rules) NPC designer for Foundry VTT. A Game Master will give you a short NPC concept, in English or Spanish. Output ONLY valid JSON (no markdown fences, no prose, no trailing comments) matching exactly this shape:
{
  "name": string,
  "level": integer (1-20, approximate character level driving CR; use 1-3 for a minor NPC unless the concept implies more),
  "cr": number (challenge rating; MUST be one of: 0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30),
  "size": "tiny"|"sm"|"med"|"lg"|"huge"|"grg",
  "type": string (creature type, e.g. "humanoid (goblin)", "beast", "fiend"),
  "alignment": string,
  "abilities": { "str": int, "dex": int, "con": int, "int": int, "wis": int, "cha": int } (each 1-30; a typical minor NPC ranges 6-16, a powerful monster can go higher),
  "hp": integer (>= 1, scaled to CR: a CR 1/8 creature has roughly 1-20 HP, a CR 5 creature roughly 60-90 HP),
  "ac": integer (5-30, typically 10-18 for low-CR creatures),
  "acFormula": string (short explanation, e.g. "leather armor + dex"),
  "speed": integer (feet, multiple of 5, typically 20-40),
  "skillProficiencies": string[] (ONLY these exact dnd5e skill keys: acr,ani,arc,ath,dec,his,ins,itm,inv,med,nat,prc,prf,per,rel,slt,ste,sur — pick only the ones the concept clearly implies, do not invent others),
  "saveProficiencies": string[] (ONLY these exact ability keys: str,dex,con,int,wis,cha),
  "senses": string,
  "languages": string,
  "equipment": string[] (real D&D 5e item names for weapons/armor/gear, e.g. "Dagger", "Leather Armor" — prefer official SRD item names so they match the compendium),
  "spells": string[] (real D&D 5e spell names, empty array if the concept is not a spellcaster),
  "features": [{ "name": string, "description": string }] (class/racial features actually implied by the concept, e.g. Sneak Attack, Pack Tactics, Multiattack; empty array if none),
  "biography": string (2-3 sentences: personality, appearance, motivation)
}

Rules:
- Every field is required; never omit a key or leave "name" empty. Use sensible D&D 5e defaults when the concept doesn't specify something, but never invent stats wildly out of balance for the implied CR.
- Respond in the same language as the NPC concept (English or Spanish): write "name", "alignment", "type", "acFormula", "senses", "languages", "biography" and every feature "description" in that language. Item and spell names in "equipment"/"spells" must stay in English (official D&D 5e names) so they can be matched against the compendium.
- All JSON keys and enum values ("size", skill keys, ability keys) must stay exactly as specified above, in English, regardless of the input language.
- Only output the JSON object, nothing else.`;

function buildAbilities(spec) {
  const abilities = {};
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
    const value = spec.abilities?.[key] ?? 10;
    const proficient = spec.saveProficiencies?.includes(key) ? 1 : 0;
    abilities[key] = { value, proficient };
  }
  return abilities;
}

function buildSkills(spec) {
  const skills = {};
  for (const key of spec.skillProficiencies ?? []) {
    if (SKILL_ABILITY[key]) skills[key] = { value: 1 };
  }
  return skills;
}

export const Dnd5eSystem = {
  id: "dnd5e",
  schemaPrompt: SCHEMA_PROMPT,

  buildActorData(spec) {
    return {
      name: spec.name ?? "Unnamed NPC",
      type: "npc",
      img: "icons/svg/mystery-man.svg",
      system: {
        abilities: buildAbilities(spec),
        attributes: {
          hp: { value: spec.hp ?? 1, max: spec.hp ?? 1, formula: "" },
          ac: { flat: spec.ac ?? 10, calc: "flat" },
          movement: { walk: spec.speed ?? 30, units: "ft" },
          senses: { special: spec.senses ?? "" }
        },
        details: {
          cr: spec.cr ?? 0.25,
          type: { value: spec.type ?? "humanoid" },
          alignment: spec.alignment ?? "",
          biography: { value: `<p>${spec.biography ?? ""}</p>` }
        },
        traits: {
          size: spec.size ?? "med",
          languages: { custom: spec.languages ?? "" }
        },
        skills: buildSkills(spec)
      }
    };
  },

  /** Name lists to resolve against Item compendiums, grouped by fallback item type. */
  itemGroups(spec) {
    return [
      { names: spec.equipment ?? [], fallbackType: "loot" },
      { names: spec.spells ?? [], fallbackType: "spell" }
    ];
  },

  features(spec) {
    return (spec.features ?? []).map(f => ({
      name: f.name, type: "feat", system: { description: { value: `<p>${f.description ?? ""}</p>` } },
      img: "icons/svg/book.svg", flags: { "npc-auto-builder": { validated: false } }
    }));
  }
};
