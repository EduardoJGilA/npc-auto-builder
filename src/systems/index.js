import { Dnd5eSystem } from "./dnd5e.js";
import { VaesenSystem } from "./vaesen.js";

const SYSTEMS = { dnd5e: Dnd5eSystem, vaesen: VaesenSystem };

export function getSystem() {
  const system = SYSTEMS[game.system.id];
  if (!system) throw new Error(game.i18n.format("NAB.Error.UnsupportedSystem", { system: game.system.id }));
  return system;
}
