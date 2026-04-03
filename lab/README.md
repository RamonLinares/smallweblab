# Prototype Lab

Start with `lab/catalog.json`. It is the source of truth for both:

- homepage rendering in `index.html` + `script.js`
- prototype syncing via `scripts/sync_prototypes.py`

This folder is managed by `scripts/sync_prototypes.py` and the
`Sync prototypes` GitHub Actions workflow.

- Add or edit entries in `lab/catalog.json`.
- Each entry can define a `sync` block that mirrors a source repo into `lab/<slug>/`.
- The homepage reads the same catalog and renders prototype cards automatically.
- Do not hand-edit synced prototype folders because the next sync will overwrite them.

Future Codex threads should read:

- `lab/catalog.json`
- `lab/README.md`
- `scripts/sync_prototypes.py`
- `.github/workflows/sync-prototypes.yml`
