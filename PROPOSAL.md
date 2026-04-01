# Portfolio Hub Proposal

## Summary

Use `smallweblab.com` as the public home for your shipped web products and experiments.

The cheapest practical setup is:

- a public GitHub repository
- a static site
- Cloudflare Pages hosting
- `smallweblab.com` managed in Cloudflare DNS

That keeps the ongoing hosting cost at effectively `$0` beyond the domain renewal.

## Domain Choice

`smallweblab.com` is a better fit than either `cameragearweb.com` or `listban.com`.

Why it works:

- broad enough for sites, games, and AI tools
- short and easier to remember
- "lab" implies experimentation without sounding sloppy
- it does not lock the portfolio into a camera niche
- it does not sound like a blacklist or moderation product

I would use `Small Web Lab` as the site brand, not just as the domain.

## Recommendation

Make the site feel like a small product lab with shipped work, not a freelance portfolio and not an agency site.

Suggested framing:

- brand: `Small Web Lab`
- small label: `smallweblab.com`
- main headline: `Shipped sites, games, and AI experiments.`
- subheading: `A growing collection of small internet products built fast, published live, and refined in public.`

This is broad enough for:

- `LensDigest`
- `Breakshot 3D`
- `Arcana Muse`
- whatever you build next

## Why Cloudflare Pages

Now that the domain is registered at Cloudflare, Cloudflare Pages is the cleanest low-cost setup.

Why it fits:

- no hosting bill for a static site
- GitHub repo integration for deploys
- custom domains are configured directly in Cloudflare Pages
- your registrar, DNS, and hosting setup stay in one place
- HTTPS is handled automatically
- you can add redirects, analytics, or Workers later without moving platforms

This is a better default than GitHub Pages for this specific domain because the domain already lives in Cloudflare.

## Recommended Site Shape

Start with a one-page site. Do not overbuild it.

Sections:

1. Hero
2. Featured projects
3. How the lab works
4. What is next
5. Links

### Hero

Goal:

- explain the site in one screen
- make the cross-category nature feel intentional

Draft copy:

> Small Web Lab
>
> Shipped sites, games, and AI experiments.
>
> A growing collection of small internet products built fast, tested live, and improved over time.

Primary CTA:

- `View projects`

Secondary CTA:

- `See what's next`

### Featured Projects

Use three strong cards, one per site.

#### LensDigest

- category: `Media / SEO / Photography`
- one-liner: `A daily photography and videography digest built for search, reading flow, and fast publishing.`
- link: `https://lensdigest.com/`

#### Breakshot 3D

- category: `Browser Game / 3D`
- one-liner: `A playable 3D pool game in the browser with local matches, CPU play, and skill guides.`
- link: `https://breakshot3d.com/`

#### Arcana Muse

- category: `AI Product / Tarot`
- one-liner: `An AI tarot experience focused on reflection, rituals, and practical guidance instead of vague fortune telling.`
- link: `https://arcanamuse.com/`

Each card should include:

- live link
- short description
- stack or capability tags
- one short note on what makes the project interesting

Example tags:

- `SEO`
- `Static Site`
- `3D`
- `Game Physics`
- `AI UX`
- `Prompt Design`

### How The Lab Works

Short and candid. No agency language.

Suggested bullets:

- `Idea -> prototype -> ship -> watch behavior -> improve`
- `AI helps accelerate the build, but the product still has to work`
- `The goal is live products, not mockups`

### What Is Next

This section turns the site from a static portfolio into an active lab.

Suggested content:

- `Upcoming builds`
- `Experiments in progress`
- `Things I'm testing`

Even two placeholders are enough to signal momentum.

## Information Architecture

Phase 1 can be just one page:

- `/`

Phase 2, if you want more depth:

- `/projects/`
- `/projects/lensdigest/`
- `/projects/breakshot3d/`
- `/projects/arcanamuse/`
- `/about/`
- `/now/`

I would not start with Phase 2 unless you know you want case studies.

## Design Direction

The visual tone should be closer to:

- personal product lab
- internet studio
- shipped experiments

And less like:

- freelance portfolio
- corporate agency
- generic SaaS landing page

What I would aim for:

- clean but opinionated
- editorial typography
- muted neutral palette with one sharp accent
- project cards that feel like product tiles, not portfolio thumbnails

## Technical Setup

### Lowest-friction option

- plain static `HTML/CSS/JS`
- public GitHub repo
- Cloudflare Pages

### Best maintainability option

- `Astro`
- static build
- GitHub repo connected to Cloudflare Pages

My recommendation:

- use `Astro` if you expect to keep adding projects
- use plain static files if you want the smallest possible setup right now

Both keep the hosting cost the same.

## Domain Setup Recommendation

Use:

- primary domain: `smallweblab.com`
- secondary domain: `www.smallweblab.com`

I would make the apex domain canonical because it is shorter and cleaner.

Suggested setup in Cloudflare:

1. Create the Pages project.
2. Connect the GitHub repository.
3. Add `smallweblab.com` as a custom domain in Pages.
4. Add `www.smallweblab.com` as a second custom domain.
5. Let Cloudflare create the needed DNS records.
6. Add a redirect rule so `www` redirects to the apex, or the reverse if you prefer `www`.

Notes:

- domains registered through Cloudflare Registrar use Cloudflare nameservers
- for Pages custom domains on a Cloudflare-managed zone, Cloudflare can create the DNS records for you
- HTTPS is handled by Cloudflare once the custom domain is attached correctly

## Suggested Repository Plan

Repository name options:

- `smallweblab`
- `smallweblab-site`
- `portfolio-hub`

My preference:

- `smallweblab`

Suggested contents:

- homepage
- project data
- assets
- short README

If using Astro:

- one content file per project
- reusable project card component
- one Cloudflare Pages deployment path

## Cost

Expected ongoing cost:

- domain renewal at Cloudflare Registrar
- Cloudflare Pages hosting: `$0`

Expected extra paid services:

- none required

Optional later costs:

- analytics upgrades
- custom email
- premium monitoring

## Risks And Tradeoffs

### Main strategic risk

`Small Web Lab` can sound experimental.

Mitigation:

- emphasize shipped products
- show live links immediately
- make the copy concrete instead of abstract

### Main technical tradeoff

Cloudflare Pages is ideal for static content, but unnecessary if you want a complex app backend inside the portfolio site itself.

That is fine here, because the site only needs to direct traffic and explain what exists.

## My Recommendation In One Sentence

Yes: use `smallweblab.com` as the primary brand and ship a one-page Cloudflare Pages portfolio first.

## If You Want Me To Build It

The next practical step would be:

1. initialize a new repo in this folder
2. scaffold the site
3. build the one-page homepage
4. prepare the Cloudflare Pages deployment setup
5. give you the exact Cloudflare dashboard steps to attach the domain

## Sources Checked

- Cloudflare Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Registrar domain registration: https://developers.cloudflare.com/registrar/get-started/register-domain/
- Cloudflare Registrar FAQ: https://developers.cloudflare.com/registrar/faq/
