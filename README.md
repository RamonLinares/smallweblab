# Small Web Lab

Static product-lab site for `smallweblab.com`, now powered by the
`RamonLinares/BlogSystem` codebase.

The public site is generated from Markdown content into `out/`. The local
admin dashboard is a Vite/React app served by the Express backend.

## Project Shape

- `content/settings.json`: site identity, SEO, analytics, categories, widgets, and theme choice
- `content/posts/`: published Markdown entries for products and lab prototypes
- `templates/`: BlogSystem EJS themes and shared public assets
- `src/`: local React admin dashboard
- `server.js`: local API, static compiler, deploy helper, and admin server
- `assets/`: Small Web Lab imagery copied into `out/assets/` on publish
- `lab/`: synced prototype microsites copied into `out/lab/` on publish
- `scripts/sync_prototypes.py`: mirrors configured prototype repos into `lab/<slug>/`
- `out/`: generated static website output, ignored by git
- `dist/`: generated admin dashboard bundle, ignored by git

## Local Setup

```bash
npm install
npm run build
python3 -m http.server 4173 --directory out
```

Then open `http://localhost:4173/`.

To run the BlogSystem server and admin dashboard locally:

```bash
npm run build:admin
ADMIN_PASSWORD='replace-this' npm run start
```

Default local endpoints:

- Public generated site: `http://localhost:3001/`
- Admin dashboard: `http://localhost:3001/admin`

## Publishing

For Cloudflare Pages, use:

- Install command: `npm ci`
- Build command: `npm run build`
- Build output directory: `out`

The `build` script runs the static compiler without starting the admin server.
It writes HTML, category pages, post pages, search assets, RSS, `robots.txt`,
`sitemap.xml`, `llms.txt`, and `llms-full.txt`.

The compiler also copies:

- `assets/` to `out/assets/`
- `lab/` to `out/lab/`
- `favicon.ico` to `out/favicon.ico`

## Content Workflow

Add or edit posts in `content/posts/`.

Each post uses front matter:

```yaml
---
title: "Example"
slug: "example"
description: "Short summary for cards and SEO."
date: "2026-05-21"
category: "products"
tags: ["Static Site", "Product"]
coverImage: "/assets/example.jpg"
draft: false
---
```

Site-level settings live in `content/settings.json`. The current public
configuration uses:

- site URL: `https://smallweblab.com`
- selected template: `nordic-minimal`
- GA4 measurement ID: `G-FK26SXGK9F`
- categories: Products, Games, AI, Lab, Tools

## Prototype Sync

`lab/catalog.json` remains the source of truth for synced prototypes.

`scripts/sync_prototypes.py` mirrors each configured source repository into
`lab/<slug>/`. The BlogSystem compiler then copies those lab folders into
`out/lab/` and adds the lab routes to the generated sitemap.

Current prototype routes:

- `ping-pong-3d` -> `/lab/ping-pong-3d/`
- `asteroids-3d` -> `/lab/asteroids-3d/`
- `rally-rush` -> `/lab/rally-rush/`
- `meeting-notes` -> `/lab/meeting-notes/`

Do not hand-edit generated prototype folders unless you intend to replace the
next sync result.

## Branch Policy

This repo is the live deploy source for `smallweblab.com`.

- If the user says `push it`, `ship it`, `make it live`, or similar, default to updating `main`.
- Do not leave lab additions only on a side branch or draft PR unless the user explicitly asks for PR workflow.
- Use a PR branch only when the user asks to review changes before merge.
- If a side branch already contains the desired change, merge it into `main` before calling the task done.
