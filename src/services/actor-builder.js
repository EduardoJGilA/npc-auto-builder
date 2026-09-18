import { getSystem } from "../systems/index.js";

const packsOf = (documentName) => game.packs.filter(p => p.documentName === documentName);

/** Fuzzy-match a name against a set of compendium indexes (includes any 5e.tools/Plutonium packs already in the world). */
async function resolveFromPacks(packs, name) {
  const needle = name.trim().toLowerCase();
  for (const pack of packs) {
    const index = await pack.getIndex();
    const hit = index.find(e => e.name.toLowerCase() === needle)
      ?? index.find(e => e.name.toLowerCase().includes(needle) || needle.includes(e.name.toLowerCase()));
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

/** Resolve item names to embeddable item data, validated against system compendiums where possible. */
async function resolveItems(names = [], fallbackType) {
  const out = [];
  for (const name of names) {
    const doc = await resolveFromPacks(packsOf("Item"), name);
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

/** Try to import an existing Actor by name from any installed compendium (e.g. a 5e.tools/Plutonium bestiary). */
export async function importCompendiumActor(name) {
  const doc = await resolveFromPacks(packsOf("Actor"), name);
  if (!doc) return null;
  const data = doc.toObject();
  delete data._id;
  data.flags = foundry.utils.mergeObject(data.flags ?? {}, { "npc-auto-builder": { source: "compendium" } });
  return Actor.create(data);
}

/** Build Foundry Actor creation data from an AI-generated NPC spec, per the active game system. */
export function buildActorData(spec) {
  return getSystem().buildActorData(spec);
}

/** Create the actor + resolved items in the world, per the active game system. */
export async function createNpcActor(spec) {
  const system = getSystem();
  const actor = await Actor.create(system.buildActorData(spec));

  const groups = await Promise.all(
    system.itemGroups(spec).map(g => resolveItems(g.names, g.fallbackType))
  );
  const features = system.features?.(spec) ?? [];

  const items = [...groups.flat(), ...features];
  if (items.length) await actor.createEmbeddedDocuments("Item", items);
  return actor;
}
