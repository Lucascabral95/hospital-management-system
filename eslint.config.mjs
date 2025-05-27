import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prettier/prettier": ["error", { endOfLine: "auto", printWidth: 120 }],
    },
  },
  eslintPluginPrettierRecommended,
);
