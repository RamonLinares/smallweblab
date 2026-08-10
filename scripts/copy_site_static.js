import fs from 'fs';
import path from 'path';

const siteRoot = process.cwd();
const outDir = path.join(siteRoot, 'out');

const entries = [
  { source: 'lab', target: 'lab' },
  { source: 'play', target: 'play' },
  { source: 'favicon.ico', target: 'favicon.ico' }
];

fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(siteRoot, entry.source);
  const target = path.join(outDir, entry.target);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, {
    recursive: true,
    filter: sourcePath => path.basename(sourcePath) !== '.DS_Store'
  });
  console.log(`Copied ${entry.source} to out/${entry.target}`);
}

const styleOverride = path.join(siteRoot, 'content', 'site-overrides.css');
const publishedStyle = path.join(outDir, 'style.css');

if (fs.existsSync(styleOverride) && fs.existsSync(publishedStyle)) {
  const css = fs.readFileSync(styleOverride, 'utf8').trim();
  fs.appendFileSync(publishedStyle, `\n\n/* Small Web Lab site overrides */\n${css}\n`);
  console.log('Appended content/site-overrides.css to out/style.css');
}

function enhanceHomepageFeatures() {
  const homepage = path.join(outDir, 'index.html');

  if (!fs.existsSync(homepage)) {
    return;
  }

  let html = fs.readFileSync(homepage, 'utf8');
  const railStart = html.indexOf('<div class="rail-story-list">');
  const firstWidget = html.indexOf('<section class="magazine-widget', railStart);

  if (railStart === -1 || firstWidget === -1) {
    throw new Error('Could not find the homepage front-page story rail.');
  }

  const railMarkup = html.slice(railStart, firstWidget);
  const railStories = [...railMarkup.matchAll(/<article class="rail-story"[\s\S]*?<\/article>/g)].slice(0, 2);

  if (railStories.length !== 2) {
    throw new Error('Expected two front-page rail stories for the homepage feature grid.');
  }

  const cards = railStories.map((storyMatch) => {
    const story = storyMatch[0];
    const searchText = story.match(/data-search-text="([^"]*)"/)?.[1] || '';
    const category = story.match(/<a\b[^>]*class="magazine-category magazine-category-small"[^>]*>[\s\S]*?<\/a>/)?.[0];
    const heading = story.match(/<h4>([\s\S]*?)<\/h4>/)?.[1];
    const postUrl = heading?.match(/href="([^"]+)"/)?.[1];
    const slug = postUrl?.match(/^\/posts\/([^/]+)\//)?.[1];

    if (!category || !heading || !postUrl || !slug) {
      throw new Error('Could not read a front-page rail story.');
    }

    const postPage = path.join(outDir, 'posts', slug, 'index.html');
    const postHtml = fs.readFileSync(postPage, 'utf8');
    const coverImage = postHtml.match(/<div class="article-media">[\s\S]*?<img src="([^"]+)"/)?.[1];
    const title = heading.replace(/<[^>]+>/g, '').trim();
    const media = coverImage
      ? `<img src="${coverImage}" alt="${title}" loading="lazy" decoding="async">`
      : `<span class="image-placeholder">${title.slice(0, 2).toUpperCase()}</span>`;

    return `          <article class="homepage-feature-card" data-search-card data-search-text="${searchText}">
            <a class="homepage-feature-media" href="${postUrl}">
              ${media}
            </a>
            <div class="homepage-feature-copy">
              ${category}
              <h3>${heading}</h3>
            </div>
          </article>`;
  });

  for (const storyMatch of railStories) {
    html = html.replace(storyMatch[0], '');
  }

  const featureGrid = `        <section class="homepage-feature-grid" aria-label="More featured stories">
${cards.join('\n')}
        </section>`;
  const leadBoundary = /(<article class="magazine-lead-story"[\s\S]*?<\/article>)\s*(<aside class="front-rail">)/;

  if (!leadBoundary.test(html)) {
    throw new Error('Could not find the homepage lead-story boundary.');
  }

  html = html.replace(leadBoundary, `$1\n\n${featureGrid}\n\n        $2`);
  html = html.replace(
    /(<aside class="front-rail">\s*)<h3><span><\/span>On the front page<\/h3>/,
    '$1<h3><span></span>More from the lab</h3>'
  );
  fs.writeFileSync(homepage, html, 'utf8');
  console.log('Expanded the homepage to three featured stories');
}

enhanceHomepageFeatures();

const postsDir = path.join(siteRoot, 'content', 'posts');

if (fs.existsSync(postsDir)) {
  const jsonLdPattern = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi;

  for (const filename of fs.readdirSync(postsDir)) {
    if (path.extname(filename) !== '.md') {
      continue;
    }

    const source = fs.readFileSync(path.join(postsDir, filename), 'utf8');
    const slug = source.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
    const blocks = [...source.matchAll(jsonLdPattern)];

    if (!slug || blocks.length === 0) {
      continue;
    }

    const publishedPost = path.join(outDir, 'posts', slug, 'index.html');

    if (!fs.existsSync(publishedPost)) {
      continue;
    }

    const scripts = blocks.map((match) => {
      const data = JSON.parse(match[1]);
      const json = JSON.stringify(data, null, 2).replaceAll('<', '\\u003c');
      return `<script type="application/ld+json">${json}</script>`;
    }).join('\n  ');
    const html = fs.readFileSync(publishedPost, 'utf8');

    if (!html.includes('</head>')) {
      throw new Error(`Missing </head> in out/posts/${slug}/index.html`);
    }

    fs.writeFileSync(publishedPost, html.replace('</head>', `  ${scripts}\n</head>`), 'utf8');
    console.log(`Injected authored JSON-LD into out/posts/${slug}/index.html`);
  }
}
