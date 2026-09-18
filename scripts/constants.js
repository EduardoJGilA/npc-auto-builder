export const MODULE_ID = "npc-auto-builder";
export const t = (key, data) => game.i18n.format(key, data);

// CR -> proficiency bonus (DMG table)
export function profBonusForCR(cr) {
  if (cr < 5) return 2;
  return Math.ceil(cr / 4) + 1;
}

export const SKILL_ABILITY = {
  acr: "dex", ani: "wis", arc: "int", ath: "str", dec: "cha", his: "int",
  ins: "wis", itm: "cha", inv: "int", med: "wis", nat: "int", prc: "wis",
  prf: "cha", per: "cha", rel: "int", slt: "dex", ste: "dex", sur: "wis"
};
