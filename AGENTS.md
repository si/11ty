# AGENTS.md - Project Documentation for AI Assistants

## Project Overview

This is **Si Jobling's personal website** built with [Eleventy (11ty)](https://www.11ty.dev/), a static site generator. The site is based on the [eleventy-high-performance-blog](https://github.com/11ty/eleventy-base-blog) starter and is deployed on Cloudflare Pages.

**Site URL**: https://sijobling.com  
**Primary Technologies**: Eleventy 1.0, Node.js 18.x, Nunjucks templating, Markdown

---

## Project Structure

### Core Configuration Files

- **`.eleventy.js`** - Main Eleventy configuration file that:
  - Registers plugins (RSS, syntax highlighting, navigation)
  - Configures custom filters and shortcodes
  - Sets up collections for different post types
  - Defines HTML transformations and optimizations
  - Configures image processing and local image caching

- **`package.json`** - Dependencies and build scripts
  - Build commands: `npm run build`, `npm run serve`
  - Watch mode: `npm run watch`
  - Testing: `npm run test`

- **`rollup.config.js`** - JavaScript bundling configuration for client-side code

### Directory Structure

#### `/posts/` - Content Directory
The main content area organized by content type:

- **`/posts/blog/`** - Main blog posts organized by year (2011-2025)
- **`/posts/aside/`** - Shorter thoughts/notes organized by year
- **`/posts/portfolio/`** - Portfolio/project showcase items
- **`/posts/weeknotes/`** - Weekly update posts (numbered 1-N)
- **`/posts/reading/`** - Books I've read, one post per book (see "Reading, Music and Habits" below)

Each directory has a `posts.11tydata.js` file that sets default frontmatter for that section.

#### `/_data/` - Global Data Files
Data files accessible to all templates:

- **`metadata.json`** - Site-wide metadata (title, URL, author, feeds)
- **`csp.js`** - Content Security Policy configuration
- **`googleanalytics.js`** - Google Analytics configuration
- **`isdevelopment.js`** - Development mode detection
- **`webvitals.js`** - Web Vitals tracking configuration

#### `/_includes/` - Templates & Layouts
Nunjucks templates for rendering pages:

- **`/layouts/base.njk`** - Base HTML template
- **`/layouts/home.njk`** - Homepage layout
- **`/layouts/post.njk`** - Individual post layout
- **`postslist.njk`** - Reusable component for listing posts
- **`clap.njk`** - Clapping/applause component

#### `/_11ty/` - Custom Plugins & Transforms
Custom Eleventy plugins and HTML transformations:

- **`apply-csp.js`** - Applies Content Security Policy headers
- **`blurry-placeholder.js`** - Generates blurred image placeholders
- **`figure-row.js`** - `{% figureRow %}` / `{% rowFigure %}` shortcodes for side-by-side images (see Reusable Content Components)
- **`getTagList.js`** - Extracts and manages post tags
- **`stat-cards.js`** - `{% statCards %}` / `{% statCard %}` shortcodes for metric cards
- **`img-dim.js`** - Adds image dimensions to img tags
- **`json-ld.js`** - Adds JSON-LD structured data
- **`optimize-html.js`** - Minifies and optimizes HTML output
- **`srcset.js`** - Generates responsive image srcsets
- **`video-gif.js`** - Converts videos to GIF format
- **`youtube-embed.js`** - Embeds YouTube videos
- **`youtube-html-transform.js`** - Transforms YouTube embeds in HTML

#### `/img/` - Image Assets
Image storage organized by category:

- **`/img/assets/`** - General assets organized by year (2010-2025)
- **`/img/posts/portfolio/`** - Portfolio-specific images
- **`/img/remote/`** - Cached remote images (downloaded and optimized)
- **`/img/favicon/`** - Favicon assets

#### `/css/` & `/js/` - Static Assets
- **`/css/main.css`** - Main stylesheet
- **`/js/cached.js`** - Cached JavaScript
- **`/js/web-vitals.js`** - Web Vitals tracking code

#### `/feed/` - RSS/Atom Feeds
Templates for various feed formats:

- **`feed.njk`** - Main RSS feed
- **`json.njk`** - JSON feed
- **`podcast.njk`** - Podcast feed
- **`htaccess.njk`** - .htaccess file for Apache servers

#### `/api/` - API Endpoints
- **`ga.js`** - Google Analytics API endpoint

#### `/test/` - Tests
Mocha test files for validating the build:
- **`test-generic-post.js`** - Tests for post functionality

#### `/third_party/` - Third-Party Code
- **`/eleventy-plugin-local-images/`** - Plugin for downloading and caching remote images locally

---

## Key Features

### 1. **Multiple Content Types**
The site supports different content types with their own templates and collections:
- Blog posts (long-form articles)
- Asides (short notes)
- Portfolio items (project showcases)
- Weeknotes (weekly updates)

### 2. **Image Optimization**
- Local caching of remote images
- Responsive image srcsets
- Blurred placeholders for progressive loading
- Automatic dimension calculation

### 3. **Performance Optimizations**
- HTML minification
- CSS minification (via CleanCSS)
- JavaScript bundling (via Rollup)
- Content Security Policy headers
- AMP optimization (via @ampproject/toolbox-optimizer)

### 4. **SEO & Discoverability**
- JSON-LD structured data
- Multiple feed formats (RSS, JSON, Podcast)
- Sitemap generation (`sitemap.xml.njk`)
- Tag-based organization

### 5. **YouTube Integration**
- Custom YouTube embed shortcodes
- HTML transformations for video embeds
- Video to GIF conversion support

---

## Build Process

### Development Mode
```bash
npm run watch
```
- Starts Eleventy dev server with live reload
- Watches for file changes
- Builds JavaScript in watch mode
- Runs tests in watch mode

### Production Build
```bash
npm run build
```
1. Cleans the `_site/posts/*` directory
2. Bundles JavaScript with Rollup
3. Runs Eleventy to generate static HTML
4. Runs tests to validate the build

### Output
All generated files go to `/_site/` directory (not tracked in repo).

---

## Deployment

The site is deployed on **Cloudflare Pages**.

Configuration files:
- **`wrangler.toml`** - Cloudflare Pages project config
- **`_headers`** - HTTP headers configuration
- **`_redirects`** - URL redirect rules

---

## Content Authoring

### Creating a New Post

1. Create a new `.md` file in the appropriate directory:
   - Blog: `/posts/blog/YYYY/post-slug.md`
   - Aside: `/posts/aside/YYYY/post-slug.md`
   - Portfolio: `/posts/portfolio/YYYY/post-slug.md`
   - Weeknote: `/posts/weeknotes/N.md`

2. Add frontmatter:
```yaml
---
title: "Post Title"
date: 2025-01-03
tags:
  - tag1
  - tag2
---
```

3. Write content in Markdown below the frontmatter

### Frontmatter Fields
- `title` - Post title
- `date` - Publication date (YYYY-MM-DD format)
- `tags` - Array of tags for categorization
- `description` - Optional meta description
- `layout` - Template to use (defaults set in `.11tydata.js`)

---

## Reading, Music and Habits

Three related sections sit together under **Habits** in the navigation. Music and Reading are children of Habits (`parent: Habits` in their `eleventyNavigation`), shown as a smaller row under it in the nav overlay (`_includes/layouts/base.njk`), and each has a card on `/habits/` (`src/pages/habits/index.njk`).

### Habits (`/habits/`)

- Data-driven session logs in `_data/habits/*.json` (duolingo, maptap, solitaire, sudoku), loaded by `_11ty/habits-data.js` and exposed as `habitsIndex`.
- Each habit has its own page under `src/pages/habits/`. Use the `*-habit-log` skills to append new sessions.

### Reading (`/reading/`)

A book log of 121 books, built at build time from frontmatter (no client-side fetching). It has two sources:

- **Goodreads (late 2020 to early 2023)**: captured by a Zapier connection, so these only have a started date, and a finish date and rating where the book was marked as read at the time.
- **Rambling Readers (December 2022 onwards)**: an open source BookWyrm instance at https://ramblingreaders.org/user/si. Its CSV export is the source of truth for dates, ratings and reviews of anything read from December 2022. Its ActivityPub endpoints are behind a Cloudflare challenge and cannot be fetched from cloud sessions; only the `/user/si/rss*` feeds can, and they return just the last 10 items. Use the CSV export (Settings > Export) instead.

- **Posts**: `posts/reading/YYYY/<slug>.md`, published at `/reading/<slug>/` (the permalink comes from `categories: ["reading"]`). The directory data file is `posts/reading/reading.11tydata.js` (it must be named after the directory) and sets `layouts/book.njk`.
- **Frontmatter**: `title` is the short title; `book.subtitle` holds anything after the first colon, dash or bracket. `book` also holds `author`, `goodreadsId`, `goodreadsUrl`, `series`, `seriesNumber`, `published`, `averageRating` and `cover`. Books imported from Rambling Readers have `bookwyrmUrl`, plus `isbn` and `openLibraryKey` where known (used to find covers) and no Goodreads fields. `reading` holds `status` (`read`, `reading` or `to-read`), `started`, `finished` and `rating`. Post `date` is the started date, or the finished date where there is no start. Where a book has a review, the headline (bold) and text are the post body.
- **Status rules**: books are treated as read unless `status` says otherwise. `reading` (currently reading) has `started` only and shows a "Currently reading" label; finished books have `finished` and a rating; the one `to-read` book has neither. A missing rating means unrated, not zero.
- **Covers**: stored locally in `img/reading/` and referenced by `book.cover` (never hot-linked). Both scripts are throttled and resumable, and should be run on a normal machine (Goodreads and Open Library are blocked in cloud sessions). See the header of each script for flags.
  - `node scripts/fetch-book-covers.js` replaces the original 75px thumbnails with `<goodreadsId>.jpg`, for posts with a Goodreads ID.
  - `node scripts/fetch-book-covers-openlibrary.js` finds covers for posts with no cover (the Rambling Readers imports) by ISBN, Open Library ID, then a title and author search on Open Library and Google Books, and saves `<slug>.jpg`. It lists any it cannot find so they can be added by hand.
- **Pages**: `src/pages/reading/index.njk` is the cover shelf grouped by year; `_includes/layouts/book.njk` is the book post layout. Styles are `.book-shelf`, `.book-spine` and `.book-card` in `css/main.css`.
- **Feeds**: reading posts are deliberately excluded from the RSS and JSON feeds via `collections.feedPosts`, so subscribers are not re-notified about old books.
- **Redirects**: the old `/aside/<slug>/` URLs redirect to `/reading/<slug>/` (301, with and without a trailing slash) in `_redirects`. Keep these if renaming slugs.
- **Adding books**: export the CSV from Rambling Readers and run `node scripts/import-bookwyrm-export.js export.csv` (add `--dry-run` first). It is safe to re-run. It updates matching posts (matched by `bookwyrmUrl`, else author plus a fuzzy title match) and creates new ones in `posts/reading/<year started>/`. For existing posts it keeps the earliest started and finished dates, takes the export's rating, sets `date` to the started date (moving the file to that year's folder) and only adds a review if the post has no body. It never touches covers or series, so add `series` and `seriesNumber` by hand, then run the Open Library cover script. A single book can also be added by copying an existing post.

### Music (`/music/`)

- `src/pages/music/index.njk` is a hub page listing sections as cards (currently one: Liked Music).
- `src/pages/music/liked.njk` plus `js/music-liked.js` render every Spotify liked track as a shelf of record sleeves. An IFTTT recipe adds a row to a public Google Sheet on each like, and the page reads that sheet in the browser on load, so new likes appear without a rebuild. Cover art is fetched per track from Spotify oEmbed and cached in `localStorage`. Styles are the `.record-*` classes in `css/main.css`.
- Reading is static and build-time (updated by importing a Rambling Readers export); Music is live and client-side, because likes keep arriving.
## Reusable Content Components

Posts are rendered through Liquid, so shortcodes can be used directly in Markdown. Styles live in `/css/main.css`.

### Figure row (side-by-side images)

Use for two or more images that belong together (e.g. phone screenshots, before/after). Images sit **side by side from 768px up** and **stack on mobile** (each capped at 22rem wide and centred, so tall phone screenshots don't fill the screen).

```liquid
{% figureRow %}
{% rowFigure "/img/assets/2026/10/one.png", "Alt text describing the image", "Optional caption" %}
{% rowFigure "/img/assets/2026/10/two.png", "Alt text describing the image", "Optional caption" %}
{% endfigureRow %}
```

- `rowFigure` arguments: image path, alt text, optional caption (all comma separated, in quotes).
- Always provide meaningful alt text.
- Put no blank lines inside the block, or Markdown will break the HTML.
- Prefer this over stacked `<figure>` blocks whenever a post has a pair or set of screenshots.
- Source: `/_11ty/figure-row.js`, styles under `.figure-row` in `/css/main.css`.

### Stat cards

`{% statCards %}` wrapping `{% statCard "emoji", "Label", "Value", "up|down|flat", "delta text" %}` renders a grid of metric cards (used in weeknotes). Source: `/_11ty/stat-cards.js`.

---

## Navigation & Collections

Eleventy automatically creates collections:
- **`collections.blog`** - All blog posts
- **`collections.aside`** - All aside posts
- **`collections.portfolio`** - All portfolio items
- **`collections.weeknotes`** - All weeknotes
- **`collections.readingPosts`** - All book posts in `posts/reading/`
- **`collections.feedPosts`** - All posts except the reading log; used by the RSS and JSON feeds
- **`collections.tagList`** - All unique tags across the site

These collections are used in:
- **`index.njk`** - Homepage
- **`archive.njk`** - Archive page
- **`tags.njk`** - Tag listing pages
- **`asides.njk`** - Asides listing

---

## Common Tasks for AI Agents

### Adding a New Blog Post
1. Create file: `/posts/blog/2026/new-post-slug.md`
2. Add frontmatter with title, date, tags
3. Write content in Markdown
4. Run `npm run build` to test

### Modifying Site Metadata
Edit `/_data/metadata.json` to change:
- Site title
- Author information
- Feed settings
- Social media handles

### Adding a New Plugin
1. Install via npm
2. Require in `.eleventy.js`
3. Register with `eleventyConfig.addPlugin()`

### Creating a New Template
1. Create `.njk` file in `/_includes/`
2. Use Nunjucks syntax
3. Access data via `{{ variable }}`
4. Reference in frontmatter: `layout: your-template.njk`

### Modifying CSS
Edit `/css/main.css` - changes are automatically processed during build.

### Adding JavaScript
1. Edit `/src/main.js` for bundled JS
2. Or add standalone files in `/js/`
3. Rollup will bundle `/src/main.js` to output

---

## Important Notes

1. **Node Version**: Project requires Node.js 18.x
2. **Generated Files**: Never edit files in `/_site/` - they're auto-generated
3. **Image Processing**: Large images should go in `/img/` subdirectories
4. **Remote Images**: Will be automatically cached to `/img/remote/`
5. **Testing**: Always run tests before pushing: `npm run test`
6. **Clean Builds**: Use `npm run clean` to clear old generated posts

---

## Troubleshooting

### Build Fails
- Check Node.js version (must be 18.x)
- Run `npm install` to ensure dependencies are installed
- Check for syntax errors in `.eleventy.js`

### Images Not Appearing
- Verify image path is correct relative to site root
- Check if image exists in `/img/` directory
- Ensure image dimensions plugin is working

### Posts Not Showing
- Verify frontmatter is valid YAML
- Check date format (must be YYYY-MM-DD)
- Ensure file is in correct `/posts/` subdirectory
- Check that `posts.11tydata.js` has correct settings

### Styling Issues
- Clear browser cache
- Check `/css/main.css` for conflicts
- Verify CSS is being minified correctly in build

---

## Resources

- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Nunjucks Templating](https://mozilla.github.io/nunjucks/)
- [Original Starter Template](https://github.com/11ty/eleventy-base-blog)
- [Markdown Guide](https://www.markdownguide.org/)

---

## License

MIT License (see LICENSE file)

---

**Last Updated**: October 2026
