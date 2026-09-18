import "./styles/npc-builder.css";
import { MODULE_ID } from "./constants.js";
import { NpcBuilderApp } from "./apps/npc-builder-app.js";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "provider", {
    name: "NAB.Settings.Provider.Name",
    hint: "NAB.Settings.Provider.Hint",
    scope: "world", config: true, type: String,
    choices: { gemini: "Gemini", openai: "OpenAI" },
    default: "gemini"
  });

  game.settings.register(MODULE_ID, "apiKey", {
    name: "NAB.Settings.ApiKey.Name",
    hint: "NAB.Settings.ApiKey.Hint",
    scope: "world", config: true, type: String, default: ""
  });

  game.settings.register(MODULE_ID, "model", {
    name: "NAB.Settings.Model.Name",
    hint: "NAB.Settings.Model.Hint",
    scope: "world", config: true, type: String, default: "gemini-2.5-flash"
  });
});

Hooks.once("ready", () => {
  if (!game.user.isGM) return;
  game.modules.get(MODULE_ID).api = { NpcBuilderApp };
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  const tokenControl = controls.tokens ?? controls.find?.(c => c.name === "token");
  if (!tokenControl) return;
  const tool = {
    name: "npc-auto-builder", title: "NAB.Title", icon: "fa-solid fa-wand-magic-sparkles",
    button: true, onClick: () => new NpcBuilderApp().render(true)
  };
  if (Array.isArray(tokenControl.tools)) tokenControl.tools.push(tool);
  else tokenControl.tools[tool.name] = tool;
});

// Also expose the builder from the Actors sidebar, where GMs actually look for it.
Hooks.on("renderActorDirectory", (app, html) => {
  if (!game.user.isGM) return;
  const el = html instanceof HTMLElement ? html : html[0];
  const actions = el.querySelector(".header-actions.action-buttons");
  if (!actions || actions.querySelector(".npc-auto-builder-open")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "npc-auto-builder-open";
  button.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>${game.i18n.localize("NAB.Title")}</span>`;
  button.addEventListener("click", () => new NpcBuilderApp().render(true));
  actions.append(button);
});
