#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { loadAppEnv } from "./load-app-env.mjs";

loadAppEnv();

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node ./scripts/with-env.mjs <command> [...args]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
