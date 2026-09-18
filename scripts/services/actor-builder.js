import { SKILL_ABILITY } from "../constants.js";

const ITEM_PACKS = () => game.packs.filter(p => p.documentName === "Item");

/** Fuzzy-match name against compendium indexes, return best Item document or null. */
async function resolveCompendiumItem(name) {
  const needle = name.trim().toLowerCase();
  for (const pack of ITEM_PACKS()) {
    const index = await pack.getIndex();
    const hit = index.find(e => e.name.toLowerCase() === needle)
      ?? index.find(e => e.name.toLowerCase().includes(needle) || needle.includes(e.name.toLowerCase()));
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

/** Resolve item names to embeddable item data, validated against system compendium where possible. */
async function resolveItems(names = [], fallbackType = "loot") {
  const out = [];
  for (const name of names) {
    const doc = await resolveCompendiumItem(name);
    if (doc) {
      const data = doc.toObject();
      delete data._id;
      data.flags = foundry.utils.mergeObject(data.flags ?? {}, { "npc-auto-builder": { validated: true } });
      out.push(data);
    } else {
      out.push({
        name, type: fallbackType, system: {}, img: "icons/svg/item-bag.svg",
        flags: { "npc-auto-builder": { validated: false } }
      });
    }
  }
  return out;
}

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

/** Build Foundry Actor creation data from an AI-generated NPC spec. */
export function buildActorData(spec) {
  return {
    name: spec.name ?? "Unnamed NPC",
    type: "npc",
    img: "icons/svg/mystery-man.svg",
    system: {
      abilities: buildAbilities(spec),
      attributes: {
        hp: { value: spec.hp ?? 1, max: spec.hp ?? 1, formula: "" },
        ac: { flat: spec.ac ?? 10, calc: "flat" },
        movement: { walk: spec.speed ?? 30, units: "ft" }
      },
      details: {
        cr: spec.cr ?? 0.25,
        type: { value: spec.type ?? "humanoid" },
        alignment: spec.alignment ?? "",
        biography: { value: `<p>${spec.biography ?? ""}</p>` }
      },
      traits: {
        size: spec.size ?? "med",
        senses: { special: spec.senses ?? "" },
        languages: { custom: spec.languages ?? "" }
      },
      skills: buildSkills(spec)
    }
  };
}

/** Create the actor + resolved items in the world. */
export async function createNpcActor(spec) {
  const actorData = buildActorData(spec);
  const actor = await Actor.create(actorData);

  const equipment = await resolveItems(spec.equipment, "loot");
  const spells = await resolveItems(spec.spells, "spell");
  const features = (spec.features ?? []).map(f => ({
    name: f.name, type: "feat", system: { description: { value: `<p>${f.description ?? ""}</p>` } },
    img: "icons/svg/book.svg", flags: { "npc-auto-builder": { validated: false } }
  }));

  const items = [...equipment, ...spells, ...features];
  if (items.length) await actor.createEmbeddedDocuments("Item", items);
  return actor;
}
