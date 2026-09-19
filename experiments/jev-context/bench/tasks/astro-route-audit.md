Implement `route-audit.mjs` in this Astro package checkout.

The CLI must recursively inspect `dist/core`, then print one JSON object to stdout with this shape:

```json
{
  "scannedJsFiles": 0,
  "routeModules": ["dist/core/..."],
  "manifestModules": ["dist/core/..."],
  "routeImportEdges": [{"from":"dist/core/...","to":"..."}]
}
```

Requirements:

- Accept `--root PATH`; default to the current working directory.
- Scan `.js` files only, not `.d.ts` files.
- Paths in the arrays must be POSIX-style, relative to `--root`, unique, and sorted.
- A route module is a JavaScript file whose relative path or source contains the standalone word
  `route` or `routing`, case-insensitively.
- A manifest module is a JavaScript file whose relative path or source contains the standalone word
  `manifest`, case-insensitively.
- Parse static `import ... from "..."`, bare `import "..."`, and `export ... from "..."` specifiers
  from route modules. Emit one sorted, unique `{from,to}` edge for specifiers containing `route`,
  `routing`, or `manifest`. A regex parser is sufficient; do not add dependencies.
- Ignore unreadable files with a warning on stderr and continue.
- Exit nonzero for an invalid or missing `--root`.
- Do not hardcode this checkout's absolute path or a list of known files.

This is a long-context evaluation. Before implementing, find the 20 largest `.js` files under
`dist/core` and inspect each of those 20 files with the Read tool. The set must include
`dist/core/routing/create-manifest.js`; add it if size ordering does not include it. Do not replace
these reads with a generated summary or one grep command. After implementation run the validator
command supplied by the harness and fix all failures.
