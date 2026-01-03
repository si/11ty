# AGENTS.md - Project Documentation for AI Assistants

## Project Overview

This is **Si Jobling's personal website** built with [Eleventy (11ty)](https://www.11ty.dev/), a static site generator. The site is based on the [eleventy-high-performance-blog](https://github.com/11ty/eleventy-base-blog) starter and is deployed on Netlify.

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
- **`getTagList.js`** - Extracts and manages post tags
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

The site is deployed on **Netlify** (based on the Netlify badge in README).

Configuration files:
- **`vercel.json`** - Vercel configuration (if using Vercel)
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

## Navigation & Collections

Eleventy automatically creates collections:
- **`collections.blog`** - All blog posts
- **`collections.aside`** - All aside posts
- **`collections.portfolio`** - All portfolio items
- **`collections.weeknotes`** - All weeknotes
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

**Last Updated**: January 2026
