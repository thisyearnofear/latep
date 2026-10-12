// Pre-commit guard: reject staged files over the size cap so generated
// media (renders, capture footage) can't bloat the repo history again.
// Legit shipped assets live under public/assets/ and are exempt.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const LIMIT_MB = 2;
const EXEMPT = [/^public\/assets\//];

const staged = execSync("git diff --cached --name-only --diff-filter=ACM", {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const offenders = [];
for (const file of staged) {
  if (EXEMPT.some((re) => re.test(file))) continue;
  let size;
  try {
    size = fs.statSync(path.join(process.cwd(), file)).size;
  } catch {
    continue; // renamed/deleted edge cases: nothing to measure
  }
  if (size > LIMIT_MB * 1024 * 1024) {
    offenders.push(`${(size / 1048576).toFixed(1)}MB  ${file}`);
  }
}

if (offenders.length) {
  console.error(
    `\n✗ Files over ${LIMIT_MB}MB cannot be committed:\n  ${offenders.join("\n  ")}\n` +
      `Generated media (video renders, Playwright capture footage) belongs in\n` +
      `gitignored dirs like demo-video/renders/ and e2e/demo-footage/ —\n` +
      `it can always be regenerated. Shipped assets go under public/assets/.\n`,
  );
  process.exit(1);
}
