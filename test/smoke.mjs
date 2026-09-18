/**
 * Smoke test: exercises the pure data-mapping paths (spec -> actor data)
 * without touching the network or a live Foundry world.
 *
 * Run with: node test/smoke.mjs
 */
import assert from "node:assert";

const { buildActorData } = await import("../src/services/actor-builder.js");
const { profBonusForCR } = await import("../src/constants.js");

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

const spec = {
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

console.log("\nactor-builder");

check("maps ability scores and save proficiency", () => {
  const data = buildActorData(spec);
  assert.strictEqual(data.system.abilities.dex.value, 16);
  assert.strictEqual(data.system.abilities.dex.proficient, 1);
  assert.strictEqual(data.system.abilities.str.proficient, 0);
});

check("maps hp, ac and speed", () => {
  const data = buildActorData(spec);
  assert.strictEqual(data.system.attributes.hp.max, 7);
  assert.strictEqual(data.system.attributes.ac.flat, 14);
  assert.strictEqual(data.system.attributes.movement.walk, 30);
});

check("maps skill proficiencies by known key only", () => {
  const data = buildActorData({ ...spec, skillProficiencies: ["ste", "not-a-skill"] });
  assert.deepStrictEqual(Object.keys(data.system.skills), ["ste"]);
});

check("defaults missing fields instead of throwing", () => {
  const data = buildActorData({ name: "Bare NPC" });
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

console.log(`\n${failures ? `${failures} FAILURE(S)` : "all checks passed"}\n`);
process.exit(failures ? 1 : 0);
