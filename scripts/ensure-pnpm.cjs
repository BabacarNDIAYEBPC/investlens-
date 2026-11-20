const { rmSync } = require("node:fs");

// Read the lifecycle environment directly: nested shell expansion is not
// consistent between pnpm versions and remote native-build workers.
const userAgent = process.env.npm_config_user_agent ?? "";
const executable = process.env.npm_execpath ?? "";
const isPnpm = /^pnpm(?:\/|$)/.test(userAgent)
  || /[/\\]pnpm(?:\.(?:cjs|mjs|js))?$/.test(executable);

if (!isPnpm) {
  console.error("Use pnpm instead");
  process.exit(1);
}

for (const file of ["package-lock.json", "yarn.lock"]) {
  rmSync(file, { force: true });
}
