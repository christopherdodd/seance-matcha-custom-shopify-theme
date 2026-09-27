<h1 align="center">
  Séance Matcha
</h1>

<p align="center">
  A custom Shopify Online Store 2.0 theme for a premium matcha brand.
</p>

<p align="center">
  <strong>🎓 Official class project for <a href="https://skl.sh/4AvYQSd">Shopify Web Design — Plan, Design and Build a Shopify Storefront with AI</a> on Skillshare</strong>
</p>

## About this project

Séance Matcha is a fictional premium matcha brand, and this repository is the custom Shopify theme built for it as the class project for the Skillshare course [Shopify Web Design — Plan, Design and Build a Shopify Storefront with AI](https://skl.sh/4AvYQSd). It follows the class's core workflow end to end:

1. **Plan** — a spec sheet defines behavior, data sources, and content structure for each page.
2. **Design** — a full visual design is created in Figma, section by section.
3. **Build** — the theme is implemented in code from the Figma design and spec sheet, using [Claude Code](https://claude.com/claude-code) as an AI pair-programmer for the Liquid/CSS/JS implementation, with the Figma design and spec sheet as the source of truth throughout.

The theme is built on Shopify's [Skeleton Theme](https://github.com/Shopify/skeleton-theme) scaffold and extended into a fully custom storefront: a real home page, product and collection pages, cart, search, and contact experience — not just a component demo.

## Highlights

- **AJAX cart drawer** — built on the native `<dialog>` element, driven by Shopify's Cart AJAX API (`sections` parameter on `/cart/add.js` and `/cart/change.js`), so adding or updating items updates the drawer, the header badge, and the cart page without a full reload.
- **Animated navigation, search, and cart UI** — the mobile nav drawer, cart drawer, and inline header search all slide/expand open and closed with real CSS transitions (not just show/hide), including a scrollbar-gutter fix to keep the animation jitter-free.
- **Header overlay treatment** — the header floats, transparent, over the hero section on the homepage and over the banner on collection pages, matching the Figma design's layered layout.
- **Responsive, full-bleed section layout** — every section opts into Shopify's `full-width` grid utility so backgrounds and images run edge-to-edge instead of sitting in a centered content column.
- **No bundled placeholder images** — all imagery comes from real store data (products, collections, theme settings) or from Shopify's `placeholder_svg_tag` when content hasn't been added yet, rather than shipping fake photos inside the theme package.
- **Color-inversion hover states** — buttons and links invert foreground/background color on hover instead of just fading opacity, for a crisper, more intentional interaction feel.

## Theme architecture

```bash
.
├── assets          # Stores static assets (CSS, JS, images, fonts, etc.)
├── blocks          # Reusable, nestable, customizable UI components
├── config          # Global theme settings and customization options
├── layout          # Top-level wrappers for pages (layout templates)
├── locales         # Translation files for theme internationalization
├── sections        # Modular full-width page components
├── snippets        # Reusable Liquid code or HTML fragments
└── templates       # Templates combining sections to define page structures
```

To learn more about this architecture, refer to Shopify's [theme architecture documentation](https://shopify.dev/docs/storefronts/themes/architecture).

## Getting started

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) — to preview, develop, and push the theme
- A Shopify store to preview it on (a free [development store](https://shopify.dev/docs/api/development-stores) works)

If you use VS Code:

- [Shopify Liquid VS Code Extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode) — syntax highlighting, linting, and autocompletion for Liquid

### Clone

```bash
git clone https://github.com/christopherdodd/seance-matcha-custom-shopify-theme.git
```

### Preview

```bash
shopify theme dev --store your-store.myshopify.com
```

> Note: this theme's `config/settings_data.json` and `templates/*.json` hold this project's own store content (images, copy, selected collections). Pulling/pushing those files will overwrite whatever content exists on the store you're previewing against — see `HANDOFF.md` in this repo for the full notes on that if you're picking this project up as-is.

## Class

This project was built as part of [Shopify Web Design — Plan, Design and Build a Shopify Storefront with AI](https://skl.sh/4AvYQSd) on Skillshare — a course on planning, designing, and building a real Shopify storefront using AI tools throughout the workflow.
