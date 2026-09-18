const foundryGlobals = [
  "game", "ui", "canvas", "Hooks", "CONFIG", "CONST", "foundry",
  "Actor", "Item", "ChatMessage"
].reduce((acc, name) => Object.assign(acc, { [name]: "readonly" }), {});

const browserGlobals = [
  "window", "document", "console", "URL", "Blob", "fetch"
].reduce((acc, name) => Object.assign(acc, { [name]: "readonly" }), {});

export default [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...foundryGlobals, ...browserGlobals }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
      "no-dupe-class-members": "error",
      "no-const-assign": "error",
      "no-unreachable": "error",
      "no-self-assign": "error",
      "no-constant-condition": "error"
    }
  }
];
