#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { relative, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const script = resolve(root, "route-audit.mjs");
assert.equal((await stat(script)).isFile(), true, "route-audit.mjs must exist");

async function collect(directory) {
  const output = [];
  for (const name of await readdir(directory)) {
    const path = resolve(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) output.push(...(await collect(path)));
    else if (name.endsWith(".js")) output.push(path);
  }
  return output;
}

const files = await collect(resolve(root, "dist/core"));
const posix = (path) => relative(root, path).split(sep).join("/");
const expectedRoutes = [];
const expectedManifests = [];
for (const file of files) {
  const path = posix(file);
  const source = await readFile(file, "utf8");
  if (/\b(?:route|routing)\b/i.test(`${path}\n${source}`)) expectedRoutes.push(path);
  if (/\bmanifest\b/i.test(`${path}\n${source}`)) expectedManifests.push(path);
}
expectedRoutes.sort();
expectedManifests.sort();

const run = spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
assert.equal(run.status, 0, run.stderr || "route-audit exited nonzero");
const result = JSON.parse(run.stdout);
assert.equal(result.scannedJsFiles, files.length);
assert.deepEqual(result.routeModules, expectedRoutes);
assert.deepEqual(result.manifestModules, expectedManifests);
assert.ok(Array.isArray(result.routeImportEdges));
assert.deepEqual(result.routeImportEdges, [...result.routeImportEdges].sort((a, b) =>
  `${a.from}\0${a.to}`.localeCompare(`${b.from}\0${b.to}`),
));
assert.equal(new Set(result.routeImportEdges.map((edge) => `${edge.from}\0${edge.to}`)).size,
  result.routeImportEdges.length);
const source = await readFile(script, "utf8");
assert.equal(source.includes(root), false, "script contains the checkout's absolute path");
console.log(JSON.stringify({
  ok: true,
  scannedJsFiles: files.length,
  routeModules: expectedRoutes.length,
  manifestModules: expectedManifests.length,
  routeImportEdges: result.routeImportEdges.length,
}));
