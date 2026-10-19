// Pre-commit guard: reject staged files over the size cap so generated
// media (renders, capture footage) can't bloat the repo history again.
// Legit shipped assets live under public/assets/ and are exempt.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const LIMIT_MB = 2;
const EXEMPT = [/^public\/assets\//];

// Generated demo media is rejected by path, not only by size: the tracked
// clips were under 2MB, so the size cap alone let them into history. Source
// (HTML, compositions, config, docs) stays welcome; media is regenerated.
const GENERATED_MEDIA = [
  /^demo-video\/(?:renders|\.transcode-cache|capture\/assets|snapshots)\//,
  /^demo-video\/assets\/.*\.(?:webm|mp4|wav|mp3|png)$/,
  /^demo-video\/speech\.wav$/,
  /^demo-video\/\.hyperframes\/(?:history-id|render-outputs\.json|video-state\.json|video-state-lock\/)/,
  /^demo-video-social\//,
];

const staged = execSync("git diff --cached --name-only --diff-filter=ACM", {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const offenders = [];
const mediaOffenders = [];
for (const file of staged) {
  if (EXEMPT.some((re) => re.test(file))) continue;
  if (GENERATED_MEDIA.some((re) => re.test(file))) {
    mediaOffenders.push(file);
    continue;
  }
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

if (mediaOffenders.length) {
  console.error(
    `\n✗ Generated demo media cannot be committed:\n  ${mediaOffenders.join("\n  ")}\n` +
      `Keep the demo-video source only. Renders, captures, voice bounces,\n` +
      `music, freeze frames and the social cut are gitignored; see\n` +
      `demo-video/AGENTS.md → "Media in git" for regeneration.\n`,
  );
  process.exit(1);
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
