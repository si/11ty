# Si on 11ty

Now hosted on Netlify

[![Netlify Status](https://api.netlify.com/api/v1/badges/e4905586-88ab-457b-8a0e-0df3542ad315/deploy-status)](https://app.netlify.com/projects/sijobling/deploys)

This is the source code for [sijobling.com](https://sijobling.com), a personal website and blog built with [Eleventy (11ty)](https://www.11ty.dev/). It is based on the [eleventy-high-performance-blog](https://github.com/11ty/eleventy-base-blog) starter kit.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.x is required.
- **npm**: Installed with Node.js.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sijobling/si-jobling.git
   cd si-jobling/11ty
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🛠 Development

### Local Development Server

To start a local development server with live-reloading:

```bash
npm run watch
```

This command runs Eleventy in watch mode, bundles JavaScript with Rollup, and runs tests concurrently. The site will be available at `http://localhost:8080`.

### Building for Production

To generate a production-ready static site in the `_site` directory:

```bash
npm run build
```

### Running Tests

To run the Mocha test suite:

```bash
npm run test
```

## 📂 Project Structure

- **`/_11ty/`**: Custom Eleventy plugins, filters, and HTML transformations.
- **`/_data/`**: Global data files (site metadata, CSP, etc.).
- **`/_includes/`**: Nunjucks templates and layouts.
- **`/posts/`**: Content files organized by type (blog, aside, portfolio, weeknotes).
- **`/img/`**: Image assets, including optimized remote images.
- **`/css/` & `/js/`**: Stylesheets and client-side JavaScript.
- **`.eleventy.js`**: Main Eleventy configuration.

## ✍️ Content Authoring

New posts should be added to the appropriate subdirectory in `/posts/`.

### Example Blog Post

Create a file at `/posts/blog/2026/my-new-post.md`:

```markdown
---
title: "My New Post"
date: 2026-01-03
tags:
  - tech
  - eleventy
---
Your content here...
```

## 🌐 Deployment

The site is automatically deployed to **Netlify** when changes are pushed to the `main` branch.

- **Configuration**: `_headers` and `_redirects` handle server-side behavior.
- **Environment Variables**: Managed in the Netlify dashboard.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more technical details on how this project works, see [AGENTS.md](AGENTS.md).

