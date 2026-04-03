# Small Web Lab

Static portfolio hub for `smallweblab.com`.

## Files

- `index.html`: homepage
- `styles.css`: layout, typography, motion, and responsive styles
- `script.js`: scroll progress, reveal animations, and subtle tilt interactions
- `assets/`: project imagery pulled from the live sites
- `lab/`: synced prototype microsites served from `/lab/<slug>/`
- `PROPOSAL.md`: original direction and platform recommendation

## Prototype Sync

Prototype sites can live in their own repositories and still be published under
`smallweblab.com/lab/<slug>/`.

- Source repos are listed in `.github/prototype-sources.json`.
- `scripts/sync_prototypes.py` mirrors each configured source into `lab/<slug>/`.
- `.github/workflows/sync-prototypes.yml` runs hourly and can also be triggered manually.
- The workflow also accepts a `repository_dispatch` event named `prototype-updated`
  if you later want upstream repos to trigger immediate syncs on push.

Current first prototype:

- `ping-pong-3d` -> `/lab/ping-pong-3d/`

## Cloudflare Pages Setup

For the current static version:

1. Create a GitHub repository from this folder.
2. Push the contents to your default branch, ideally `main`.
3. In Cloudflare Pages, create a new project and connect the GitHub repo.
4. Use the static HTML setup:
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `/`
5. After the first deploy, attach:
   - `smallweblab.com`
   - `www.smallweblab.com`
6. Set a redirect rule so only one canonical hostname remains live.

## Local Preview

From this folder:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.
