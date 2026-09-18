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
