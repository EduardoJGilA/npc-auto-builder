import { MODULE_ID } from "../constants.js";
import { generateNpcSpec } from "../services/ai-service.js";
import { createNpcActor, importCompendiumActor } from "../services/actor-builder.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NpcBuilderApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "npc-auto-builder-app",
    classes: ["npc-auto-builder"],
    tag: "form",
    window: { title: "NAB.Title", icon: "fa-solid fa-wand-magic-sparkles", resizable: true },
    position: { width: 520, height: "auto" },
    actions: {
      generate: NpcBuilderApp.#onGenerate,
      importCompendium: NpcBuilderApp.#onImportCompendium,
      exportJson: NpcBuilderApp.#onExport
    }
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/npc-builder.hbs`, root: true }
  };

  spec = null;

  async _prepareContext() {
    return { spec: this.spec };
  }

  static async #onGenerate(event, target) {
    const app = this;
    const textarea = app.element.querySelector("textarea[name=description]");
    const description = textarea?.value?.trim();
    if (!description) return ui.notifications.warn(game.i18n.localize("NAB.Warn.NoDescription"));

    target.disabled = true;
    const original = target.textContent;
    target.textContent = game.i18n.localize("NAB.Generating");
    try {
      app.spec = await generateNpcSpec(description);
      await createNpcActor(app.spec);
      ui.notifications.info(game.i18n.format("NAB.Success", { name: app.spec.name }));
      app.render();
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    } finally {
      target.disabled = false;
      target.textContent = original;
    }
  }

  static async #onImportCompendium(event, target) {
    const input = this.element.querySelector("input[name=compendiumName]");
    const name = input?.value?.trim();
    if (!name) return ui.notifications.warn(game.i18n.localize("NAB.Warn.NoName"));

    target.disabled = true;
    try {
      const actor = await importCompendiumActor(name);
      if (!actor) return ui.notifications.warn(game.i18n.format("NAB.Warn.NoCompendiumMatch", { name }));
      ui.notifications.info(game.i18n.format("NAB.Success", { name: actor.name }));
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    } finally {
      target.disabled = false;
    }
  }

  static #onExport() {
    if (!this.spec) return;
    const blob = new Blob([JSON.stringify(this.spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.spec.name ?? "npc"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
