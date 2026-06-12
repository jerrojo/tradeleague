import globals from "globals";
import react from "eslint-plugin-react";
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react },
    languageOptions: {
      ecmaVersion: "latest", sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser }
    },
    rules: { "no-undef": "error", "no-unused-vars": "off", "react/jsx-uses-vars": "error", "react/jsx-no-undef": "error" }
  }
];
