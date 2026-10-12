# Repository guidelines

## No large files in git

- Never commit generated media: video renders, screen-capture footage, audio
  bounces. Output directories are gitignored (`demo-video/renders/`,
  `e2e/demo-footage/`) — regenerate them instead of tracking them.
- A pre-commit hook (`scripts/check-large-files.cjs`) rejects any staged file
  over 2 MB. Shipped web assets under `public/assets/` are the only exemption.
- If a new asset genuinely must ship in-repo and is over the cap, raise the
  limit in the script deliberately — don't bypass the hook with `--no-verify`.
