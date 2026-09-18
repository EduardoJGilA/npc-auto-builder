const NPC_SKILLS = [
  "agility", "closeCombat", "force", "medicine", "rangedCombat", "stealth",
  "investigation", "learning", "vigilance", "inspiration", "manipulation", "observation"
];

const SCHEMA_PROMPT = `You are a Vaesen (Nordic horror RPG) NPC/creature designer. Output ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:
{
  "name": string,
  "category": "npc" | "vaesen" (npc = mundane human, vaesen = supernatural creature/threat),
  "attributes": { "physique": int, "precision": int, "logic": int, "empathy": int, "magic": int } (npc only, 2-5 each),
  "skills": { "agility": int, "closeCombat": int, "force": int, "medicine": int, "rangedCombat": int, "stealth": int, "investigation": int, "learning": int, "vigilance": int, "inspiration": int, "manipulation": int, "observation": int } (npc only, 0-5 each),
  "conditionMax": { "physical": int, "mental": int } (npc only, usually equal to physique/empathy),
  "vaesenAttributes": { "might": int, "bodyControl": int, "magic": int, "manipulation": int } (vaesen only, 2-8 each),
  "fear": { "initial": int, "subsequent": int } (vaesen only),
  "weapons": string[] (weapon or attack names),
  "gear": string[] (mundane gear/item names),
  "talents": [{ "name": string, "description": string }] (special abilities),
  "information": string (2-3 sentences: role, motivation, appearance)
}
Only include the fields relevant to the chosen category; omit or zero the rest. Only output the JSON object.`;

export const VaesenSystem = {
  id: "vaesen",
  schemaPrompt: SCHEMA_PROMPT,

  buildActorData(spec) {
    const isVaesen = spec.category === "vaesen";
    const base = {
      name: spec.name ?? "Unnamed NPC",
      type: isVaesen ? "vaesen" : "npc",
      img: "icons/svg/mystery-man.svg"
    };

    if (isVaesen) {
      const a = spec.vaesenAttributes ?? {};
      base.system = {
        attribute: {
          might: { value: a.might ?? 3 },
          bodyControl: { value: a.bodyControl ?? 3 },
          magic: { value: a.magic ?? 3 },
          manipulation: { value: a.manipulation ?? 3 }
        },
        fear: { initial: spec.fear?.initial ?? 1, subsequent: spec.fear?.subsequent ?? 1 },
        note: spec.information ?? ""
      };
      return base;
    }

    const attr = spec.attributes ?? {};
    const skills = {};
    for (const key of NPC_SKILLS) {
      if (spec.skills?.[key] !== undefined) skills[key] = { value: spec.skills[key] };
    }
    base.system = {
      attribute: {
        magic: { value: attr.magic ?? 2 },
        physique: { value: attr.physique ?? 3 },
        precision: { value: attr.precision ?? 3 },
        logic: { value: attr.logic ?? 3 },
        empathy: { value: attr.empathy ?? 3 }
      },
      skill: skills,
      condition: {
        physical: { value: 0, max: spec.conditionMax?.physical ?? attr.physique ?? 3 },
        mental: { value: 0, max: spec.conditionMax?.mental ?? attr.empathy ?? 3 }
      },
      information: spec.information ?? ""
    };
    return base;
  },

  itemGroups(spec) {
    return [
      { names: spec.weapons ?? [], fallbackType: "weapon" },
      { names: spec.gear ?? [], fallbackType: "gear" }
    ];
  },

  features(spec) {
    return (spec.talents ?? []).map(t => ({
      name: t.name, type: "talent", system: { description: t.description ?? "" },
      img: "icons/svg/book.svg", flags: { "npc-auto-builder": { validated: false } }
    }));
  }
};
