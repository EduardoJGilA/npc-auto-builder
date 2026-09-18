/**
 * Smoke test: exercises the pure data-mapping paths (spec -> actor data)
 * for every supported system, without touching the network or a live world.
 *
 * Run with: node test/smoke.mjs
 */
import assert from "node:assert";

globalThis.game = { system: { id: "dnd5e" }, i18n: { format: (key, data) => `${key}:${JSON.stringify(data)}` } };

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
};

/* -------------------------------------------- */
/*  dnd5e adapter                                */
/* -------------------------------------------- */

const { Dnd5eSystem } = await import("../src/systems/dnd5e.js");
const { profBonusForCR } = await import("../src/constants.js");

console.log("\ndnd5e adapter");

const dndSpec = {
  name: "Grix the Sly",
  cr: 0.25,
  type: "humanoid (goblin)",
  alignment: "Neutral Evil",
  abilities: { str: 8, dex: 16, con: 10, int: 10, wis: 8, cha: 8 },
  hp: 7,
  ac: 14,
  speed: 30,
  size: "sm",
  skillProficiencies: ["ste", "dec"],
  saveProficiencies: ["dex"],
  senses: "darkvision 60 ft",
  languages: "Common, Goblin",
  biography: "A sly ambusher."
};

check("maps ability scores and save proficiency", () => {
  const data = Dnd5eSystem.buildActorData(dndSpec);
  assert.strictEqual(data.system.abilities.dex.value, 16);
  assert.strictEqual(data.system.abilities.dex.proficient, 1);
  assert.strictEqual(data.system.abilities.str.proficient, 0);
});

check("maps hp, ac, speed and senses onto attributes", () => {
  const data = Dnd5eSystem.buildActorData(dndSpec);
  assert.strictEqual(data.system.attributes.hp.max, 7);
  assert.strictEqual(data.system.attributes.ac.flat, 14);
  assert.strictEqual(data.system.attributes.movement.walk, 30);
  assert.strictEqual(data.system.attributes.senses.special, "darkvision 60 ft");
});

check("maps skill proficiencies by known key only", () => {
  const data = Dnd5eSystem.buildActorData({ ...dndSpec, skillProficiencies: ["ste", "not-a-skill"] });
  assert.deepStrictEqual(Object.keys(data.system.skills), ["ste"]);
});

check("defaults missing fields instead of throwing", () => {
  const data = Dnd5eSystem.buildActorData({ name: "Bare NPC" });
  assert.strictEqual(data.system.attributes.hp.max, 1);
  assert.strictEqual(data.system.attributes.ac.flat, 10);
});

console.log("\nconstants");

check("proficiency bonus follows the DMG CR table", () => {
  assert.strictEqual(profBonusForCR(0.25), 2);
  assert.strictEqual(profBonusForCR(4), 2);
  assert.strictEqual(profBonusForCR(5), 3);
  assert.strictEqual(profBonusForCR(17), 6);
});

/* -------------------------------------------- */
/*  vaesen adapter                               */
/* -------------------------------------------- */

const { VaesenSystem } = await import("../src/systems/vaesen.js");

console.log("\nvaesen adapter");

check("builds a mundane npc with attributes, skills and condition max", () => {
  const data = VaesenSystem.buildActorData({
    name: "Constable Berg",
    category: "npc",
    attributes: { physique: 4, precision: 3, logic: 3, empathy: 2, magic: 0 },
    skills: { closeCombat: 3, vigilance: 2 },
    conditionMax: { physical: 4, mental: 2 }
  });
  assert.strictEqual(data.type, "npc");
  assert.strictEqual(data.system.attribute.physique.value, 4);
  assert.strictEqual(data.system.skill.closeCombat.value, 3);
  assert.strictEqual(data.system.condition.physical.max, 4);
  assert.strictEqual(data.system.condition.mental.max, 2);
});

check("builds a supernatural threat with vaesen attributes and fear", () => {
  const data = VaesenSystem.buildActorData({
    name: "The Mylings' Mother",
    category: "vaesen",
    vaesenAttributes: { might: 6, bodyControl: 5, magic: 7, manipulation: 4 },
    fear: { initial: 2, subsequent: 1 }
  });
  assert.strictEqual(data.type, "vaesen");
  assert.strictEqual(data.system.attribute.magic.value, 7);
  assert.strictEqual(data.system.fear.initial, 2);
  assert.strictEqual(data.system.condition, undefined, "vaesen threats have no condition track");
});

/* -------------------------------------------- */
/*  system registry                              */
/* -------------------------------------------- */

const { getSystem } = await import("../src/systems/index.js");

console.log("\nsystem registry");

check("resolves the active game system by id", () => {
  globalThis.game.system.id = "vaesen";
  assert.strictEqual(getSystem().id, "vaesen");
  globalThis.game.system.id = "dnd5e";
  assert.strictEqual(getSystem().id, "dnd5e");
});

check("throws a clear error for an unsupported system", () => {
  globalThis.game.system.id = "pf2e";
  assert.throws(() => getSystem(), /NAB.Error.UnsupportedSystem/);
  globalThis.game.system.id = "dnd5e";
});

console.log(`\n${failures ? `${failures} FAILURE(S)` : "all checks passed"}\n`);
process.exit(failures ? 1 : 0);
