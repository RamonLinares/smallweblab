# Prototype Lab

Start with `lab/catalog.json`. It is the source of truth for synced prototype
routes under `/lab/<slug>/`.

This folder is managed by `scripts/sync_prototypes.py` and the `Sync prototypes`
GitHub Actions workflow.

- Add or edit entries in `lab/catalog.json`.
- Each entry can define a `sync` block that mirrors a source repo into `lab/<slug>/`.
- The BlogSystem compiler copies this folder into `out/lab/` during `npm run build`.
- The BlogSystem compiler also adds catalog routes to the generated `out/sitemap.xml`.
- Do not hand-edit synced prototype folders because the next sync will overwrite them.

Future Codex threads should read:

- `lab/catalog.json`
- `lab/README.md`
- `scripts/sync_prototypes.py`
- `.github/workflows/sync-prototypes.yml`
- `server.js`

Branch policy for this repo:

- `smallweblab` deploys from `main`.
- If the user asks to add a lab repo and `push it`, that means the change belongs on `main`.
- Do not stop at a draft PR or side branch unless the user explicitly asks for PR review flow.
