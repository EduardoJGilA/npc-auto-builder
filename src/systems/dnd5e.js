import { SKILL_ABILITY } from "../constants.js";

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
