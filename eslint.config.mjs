import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Disable the React 19 "set state directly inside an effect body" rule.
    // The codebase uses the established `useEffect → setState` pattern in
    // dozens of places to (1) sync URL/state, (2) reset paginated queries,
    // and (3) trigger refetches. Migrating every callsite to TanStack Query
    // or `useSyncExternalStore` is out of scope for current refactors; the
    // rule is kept off until a deliberate migration is scheduled.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
