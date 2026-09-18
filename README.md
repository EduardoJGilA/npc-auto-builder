# D&D5e NPC Auto-Builder

AI-powered NPC generator for Foundry VTT (D&D 5e, v14). Describe an NPC in plain text, get a validated, ready-to-use actor.

## Setup

1. Enable the module.
2. Configure Settings → D&D5e NPC Auto-Builder: provider (Gemini/OpenAI), API key, model.
3. Token controls → wand icon → describe the NPC → Generate.

## Development

```
npm install
npm run check   # lint + smoke test + build
```

Release: bump `version` in `module.json`, push to `master`.
