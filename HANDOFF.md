# Séance Matcha — Project Handoff

Written for: a fresh Claude Code session picking up this project with no prior conversation context.

This document exists because the user is running a second Claude Code session on this same project and wants it to have full context without re-deriving everything from scratch. Read this in full before touching the theme.

---

## 1. What this project is

A custom Shopify Online Store 2.0 theme called **"Séance Matcha"** (a premium matcha brand), built from a Figma design file and a spec sheet. The build followed strict instructions: Figma is the source of truth for visual design, the spec sheet is the source of truth for behavior/data/content-source, real Shopify data is used for "store data" sections, and theme settings are used for "theme data" sections.

- **Store domain:** `seance-matcha.myshopify.com`
- **Local working directory:** `/Users/chrisdodd/Desktop/Desktop/custom-theme` (a git repo now — `git init` was run at some point; **no commits exist yet**, everything is untracked)
- **Live theme:** "Séance Matcha", id `158982832350` — originally built as unpublished, the user later published it live themselves (outside any session's actions)
- **Other themes on the store (check `shopify theme list --store seance-matcha.myshopify.com` for current state):**
  - "Horizon" — now unpublished (was the original live theme before Séance Matcha replaced it)
  - "Development (08aba5-Christophers-MacBook-Pro)" — a disposable CLI development theme, safe to overwrite entirely, used for local browser testing
- Blog/Article templates are **intentionally untouched Skeleton defaults** — the user explicitly chose "Skip for now" when there were no matching Figma frames for them.
- The Shopify MCP connector (`claude.ai Shopify`) has **repeatedly failed to authenticate** across sessions — assume it's unavailable unless proven otherwise by testing it fresh.

---

## 2. CRITICAL OPERATING RULES — read before running any Shopify CLI command

These rules exist because violating them already caused real data loss once in this project. They are also saved in this machine's Claude memory system (`~/.claude/projects/-Users-chrisdodd-Desktop-Desktop-custom-theme/memory/`), but repeating them here since this file may be read out of that context.

### 2.1 Local code vs. remote JSON — strict ownership split

- **Local files in this repo = code only:** `.liquid`, `.css`, `.js`, `.svg`. This is what gets edited here and pushed.
- **JSON theme data = owned by the user via the Shopify online store editor, directly on the live store.** This includes:
  - `config/settings_data.json`
  - every file in `templates/*.json`
  - `sections/header-group.json`, `sections/footer-group.json`
- **Never push local copies of those JSON files to the live theme, under any circumstance, unless the user explicitly asks for a specific JSON change.** Don't pull them with intent to edit or "fix" them either.
- **Every deploy must use `shopify theme push --only <exact file paths>`, naming specific `.liquid`/`.css`/`.js`/`.svg` files.** Never run a bare/unscoped `shopify theme push` against the live theme.

### 2.2 Why this rule exists (real incident)

Early in this project, `shopify theme dev --theme 158982832350` was run against the **live** theme to test changes in a browser. `theme dev` is not a read-only preview — when pointed at a real theme id, it does an initial full local→remote sync on startup and then keeps watching for changes. The local repo's JSON files were sitting at empty/default values (never edited locally), so that sync silently overwrote the user's saved theme-editor customizations on the live store. This was **not** caused by any explicit `theme push` of JSON — it was `theme dev`'s own sync behavior.

**Never run `shopify theme dev` pointed at a real theme id on this store (live, unpublished, or the named development one) if it risks a bidirectional sync with content you don't want touched.** For local browser testing, either:
- Use the existing disposable "Development" theme via `shopify theme dev --store seance-matcha.myshopify.com --theme <development-theme-id>` (safe — it has no valuable JSON to protect), or
- Avoid `theme dev` entirely and just push code to a throwaway unpublished theme, or
- Ask the user first.

If an overwrite ever happens again, the recovery path is Shopify's built-in theme editor version history (Customize → history/clock icon near Save), **not** trying to reconstruct settings from guesses.

### 2.3 Always pass `--store` explicitly

There is no `shopify.theme.toml` or `.shopify` config pinning the store in this directory. The Shopify CLI falls back to a global last-used-store cache, and on this machine that cache has been observed pointing at a **completely unrelated store** (a different client's "theluxuriateshopifytheme" project) between sessions — presumably because the same CLI installation is shared across other projects on this machine.

**Always run `shopify theme list --store seance-matcha.myshopify.com` (or any other command with `--store` explicit) — never rely on the CLI's implicit default store.** If a `theme list` output ever shows unfamiliar theme names, stop and re-run with explicit `--store` before doing anything else.

### 2.4 Standard deploy command pattern

```bash
cd /Users/chrisdodd/Desktop/Desktop/custom-theme
shopify theme check
shopify theme push --store seance-matcha.myshopify.com --theme 158982832350 --allow-live \
  --only "sections/whatever-changed.liquid" \
  --only "assets/whatever-changed.js"
```

`--allow-live` is required non-interactively because the theme is published/live; the CLI will otherwise fail with an interactive confirmation prompt it can't satisfy in a non-interactive session.

### 2.5 Browser-testing environment note

This machine runs multiple concurrent Claude Code / chrome-devtools-mcp sessions sharing one Chrome profile lock (`/Users/chrisdodd/.cache/chrome-devtools-mcp/chrome-profile`). Visual browser testing via the chrome-devtools MCP tools has intermittently failed with `"The browser is already running... Use --isolated"` errors due to this shared-profile contention. **Do not force-kill Chrome processes to resolve this** — other sessions may be actively using them; killing broadly (`pkill -f`) risks disrupting unrelated work. If blocked, disclose the limitation honestly rather than fabricating a "verified" claim, rely on `shopify theme check` + careful code review, and/or ask the user to eyeball the live/preview site themselves.

---

## 3. Chronological history of feedback and fixes

### Round 1 — initial 12-point feedback list (after first full build + deploy)

1. **No bundled theme images** — all images should come from store/theme data, not the theme package. Fixed by deleting every bundled content image (`logo-seance.png`, `hero-home.jpg`, product photos, testimonial photos, icon PNGs, collection banner) and replacing fallbacks with Liquid's `placeholder_svg_tag` filter or plain text (e.g. `{{ shop.name }}` for the logo).
2. **Layout indented on left/right, not flush with viewport edges.** Root cause, in detail: Shopify's Online Store 2.0 rendering pipeline auto-wraps every section in a `<div class="shopify-section">` — not something written directly in a section file, but generated by Shopify around whatever markup a `sections/*.liquid` file outputs. In this theme (`assets/critical.css:106-129`), that wrapper is a 3-column CSS grid, defined in the skeleton scaffold this project started from:

   ```css
   .shopify-section {
     --content-margin: minmax(var(--page-margin), 1fr);
     --content-grid: var(--content-margin) var(--content-width) var(--content-margin);
     grid-template-columns: var(--content-grid);
     display: grid;
   }

   /* Child elements, by default, are constrained to the central column of the grid. */
   .shopify-section > * {
     grid-column: 2;
   }

   /* Child elements that use the full-width utility class span the entire viewport. */
   .shopify-section > .full-width {
     grid-column: 1 / -1;
   }
   ```

   Left margin column, centered content column, right margin column — any section's root element defaults to `grid-column: 2` (the centered, max-width middle column) unless it explicitly opts into `grid-column: 1 / -1` (edge-to-edge) via the `full-width` class this same stylesheet already defines. This grid system, including the `full-width` escape hatch, was already present in the Shopify skeleton theme the project was built from — it wasn't invented for this project, but it also wasn't applied. When each of the 15 custom sections (`hero.liquid`, `header.liquid`, `footer.liquid`, `featured-collection.liquid`, etc.) was written, its root element was given a component class (e.g. `class="hero"`, `class="site-header"`) but never also `full-width`, so every section silently fell into the default centered column — producing the "indented on both left and right" look. This is a category of bug that's invisible when reading a section's own CSS in isolation and only shows up once the page actually renders in a browser, which the assistant could not do mid-build in this environment — it took the user's visual feedback to catch it. Fixed by adding `full-width` to all 15 custom sections' root elements.
3. **Missing hover states on buttons/links** — added broadly across header nav, icon buttons, mobile drawer, footer links/social/newsletter, hero CTA, product-card quick-add/title, cart line controls, cart drawer, main-product controls, collection sort/pagination, search pills, contact form.
4. **Inconsistent gaps between header icons.** Root cause: mixing a plain `<a>`, a `<shopify-account>` custom element (its own internal rendering), and another plain `<a>` as flex siblings threw off spacing. Fixed by removing `<shopify-account>` entirely and using a unified `.site-header__icon-button` class on all three icon controls.
5. **Pill header should sit over the hero section** (sticky/absolute). First implementation: `position: sticky; top: 0; margin-bottom: -96px;` scoped to `template.name == 'index'` via a `.site-header--overlay` modifier class. (This was later replaced — see Round 5/6 below.)
6. **Big gap in footer between "Stay in the loop" and the email input.** Root cause: the `{% form 'customer' %}` wrapper tag introduces its own block-level box that broke the intended flex layout. Fixed with `.site-footer__newsletter-form { display: contents; }`.
7. **Footer logo stretched horizontally.** Root cause: CSS flexbox default `align-items: stretch` in a `flex-direction: column` container stretched the `<img>` to fill the column. Fixed with `align-self: flex-start` on `.site-footer__brand img`.
8. **Center product cards when featured collection has ≤3 items.** Solved purely in CSS with `:has()`: `.featured-collection__grid:has(> :last-child:nth-child(-n + 3)) { grid-template-columns: repeat(auto-fit, 280px); justify-content: center; }` inside a `min-width: 990px` media query.
9. **Quick-add button should only show on card hover, full width.** Initial fix: `@media (hover: hover)` opacity/visibility toggle keyed off `.product-card:hover`/`:focus-within`, always visible on touch devices. (The "full width" part had a bug fixed in a later round — see Round 3, item 1.)
10. **Clicking the search icon should open an inline search input directly under the header**, not navigate away. Built an inline `<div id="header-search-bar">` panel with its own `<form>`, toggled via JS. (Positioning/animation refined in later rounds — see Round 3 item 4 and Round 4 item 2.)
11. **Cart icon and account icon operation and position were backwards.** Reordered icons to search → cart → account, made the cart a `<button data-cart-drawer-open>` and account a plain `<a href="{{ routes.account_url }}">`.
12. **Clicking the cart icon should always open the cart drawer, never navigate to `/cart`.** Built a new global cart drawer (`sections/cart-drawer.liquid`, rendered via `{% section 'cart-drawer' %}` in `layout/theme.liquid`) using a native `<dialog>` element, wired up the Shopify AJAX Cart API (`sections` parameter on `/cart/add.js` and `/cart/change.js`) so quick-add and the product-page add-to-cart open the drawer instead of redirecting.

**Bug caught during this round (not user-reported):** `.header-search-bar { display: flex; }` in the header's CSS would override the `hidden` HTML attribute, since author CSS beats the UA stylesheet's `[hidden] { display: none }` rule — meaning the search bar would always render visible regardless of JS toggling. Fixed by adding `.header-search-bar[hidden] { display: none; }` (later replaced entirely by a class-based show/hide when the search bar was rebuilt — see Round 4).

Deployed to a brand-new unpublished theme at this point, named "Séance Matcha" (id `158982832350`), explicitly not touching the pre-existing live "Horizon" theme.

### Round 2 — follow-up feedback (theme now live)

At the start of this round, `shopify theme push --theme 158982832350` (without `--allow-live`) prompted "Push theme files to the live theme?" — revealing the theme had been published live by the user between sessions, without any publish action on this session's part. Horizon was now unpublished.

1. **Contact form should stack on mobile, not sit in a row.** Root cause: `.contact-form__container` was `display: flex` with no `flex-direction` set, so its two children (the `<h1>` heading and the `<form>`) were laid out as flex-row siblings instead of stacked vertically — at **all** screen sizes, not just mobile. Fixed by adding `flex-direction: column`.
2. **Cart/account icons still operating backwards** (despite Round 1's fix). Root cause found by inspecting the actual SVG file contents: `assets/icon-cart.svg` contained a person/account glyph, and `assets/icon-account.svg` contained a shopping-bag glyph — **the two files' contents were literally swapped**, even though the Liquid wiring (which button does what) was correct. Fixed by swapping the file contents so `icon-cart.svg` has the bag and `icon-account.svg` has the person.
3. **Cart drawer should auto-update, auto-open, and update the header badge count asynchronously after add-to-cart.** Root cause found via a live test add-to-cart click (using the Shopify CLI's authenticated dev proxy + a headless browser): `routes.cart_add_url` and `routes.cart_change_url` (Liquid route helpers) resolve to `/cart/add` and `/cart/change` — **without** the `.js` suffix. The JS was fetching those URLs directly expecting a JSON response, but without `.js` Shopify treats the POST as a full-page form submission and replies with a 302 redirect to `/cart`, which silently broke `response.json()` parsing in a caught exception — so nothing visibly happened. Fixed by appending `.js` in all four places: `sections/main-product.liquid`'s add-to-cart data-url, `snippets/product-card.liquid`'s quick-add data-url, `sections/cart-drawer.liquid`'s data-change-url, and `sections/main-cart.liquid`'s data-change-url (this last one fixed an equivalent **latent bug** on the full `/cart` page's quantity controls that hadn't even been reported yet).

Deployed with `shopify theme push --theme 158982832350 --allow-live --only <specific files>` after the user explicitly confirmed pushing to the now-live theme was fine.

### Between rounds — bug caught, not requested feedback

`Liquid error (sections/header line 128): Cannot render sections inside sections` — `{% section 'cart-drawer' %}` was being called from inside `sections/header.liquid`, but Shopify's singular `{% section %}` tag can only be called from a layout file, not from within another section. Fixed by moving that call to `layout/theme.liquid` (right after `{% sections 'header-group' %}`), so the cart drawer still renders globally on every page.

### Round 3 — more changes

1. **`product-quick-add` should be `width: 100%`.** Root cause: the `<product-quick-add>` custom element wrapping the quick-add button defaulted to `display: inline` (browser default for unknown custom elements not yet CSS-styled), so the inner button's `width: 100%` had nothing meaningful to size against inside a flex row with `justify-content: center` and no `flex-grow`. Fixed by adding `product-quick-add { display: block; width: 100%; }`.
2. **Hover states shouldn't fade via opacity — invert colors instead.** Audited every `:hover { opacity: 0.x }` rule across the theme (announcement bar, cart drawer buttons, contact form submit, hero CTA, footer social icons, main-product add-to-cart, main-cart checkout/continue, mobile-nav-drawer list/utility items, a cart-line-item image link in `critical.css`) and replaced each with a genuine background/foreground color swap (filled buttons invert bg↔text with a matching border added for definition against light backgrounds; outline/ghost buttons fill solid on hover; icon links get an inverted circular badge; plain text links get a real hue change instead of a fade).
3. **Header icon order** — the user edited this directly in the local `sections/header.liquid` file themselves (reordered to search → account → cart) and explicitly said so mid-session. This was preserved as-is; no code change was made to it by the assistant.
4. **Header search bar should expand inline within the header, not float below it.** Rebuilt `.header-search-bar` from `position: absolute; top: 100%; margin-top: 8px;` (floating, detached) to a normal in-flow block directly under `.site-header__pill`, so opening it genuinely grows the header's height instead of floating a card below it with a visible gap.

Mid-verification of this round, `shopify theme dev --theme 158982832350` (targeting the live theme, for browser testing) caused the JSON data-loss incident described in section 2.2 above.

### JSON restoration incident

The user reported all their online-store-editor JSON changes had been wiped. Investigation (fresh `shopify theme pull` checks of `config/settings_data.json`, `templates/index.json`, `sections/header-group.json`, `sections/footer-group.json`) confirmed empty/default state on the live theme, both before and after the most recent scoped push — ruling out the `--only` pushes as the cause. Root cause was isolated to `shopify theme dev` being run against the live theme id (see 2.2). The user then gave the standing instruction now codified in section 2 of this document: local = code, remote JSON = the user's own via the online store editor, never overwritten by this session again.

### Round 4 — drawer animations

1. **Both the cart drawer and mobile nav drawer should animate in/out with a transition**, not snap open/closed instantly (native `<dialog>` has no built-in open/close transition). Implemented:
   - CSS: each drawer's panel starts at `transform: translateX(100%)` (cart, slides from right) or `translateX(-100%)` (nav, slides from left) with `transition: transform 0.3s ease`; an `.is-open` class flips it to `translateX(0)`. The `::backdrop` pseudo-element similarly fades `opacity: 0 → 1` under `.is-open`.
   - JS pattern (in `assets/cart-drawer.js` and the inline script in `sections/header.liquid`): `openDrawer()` calls `showModal()` then (originally) a double-`requestAnimationFrame` before adding `is-open`; `closeDrawer()` removes `is-open` *first*, waits for `transitionend` (with a timeout fallback) before actually calling `.close()`, so the dialog stays visibly open throughout the closing animation instead of vanishing instantly. The native `cancel` event (fired on Escape) is intercepted with `preventDefault()` and redirected through the same animated-close path. Rapid re-open during an in-progress close is handled via a `pendingCloseCleanup` closure that cancels the pending close without touching `dialog.close()`, letting the reopen transition take over smoothly.
   - Added a `@media (prefers-reduced-motion: reduce)` override in `assets/critical.css` collapsing all these transition durations to near-zero.
2. **The search bar should drop down from the header with a transition too.** Replaced the `hidden`-attribute instant toggle with a CSS grid-row height animation: `.header-search-bar { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }`, `.is-open { grid-template-rows: 1fr; }`, with the actual content wrapped in a new `.header-search-bar__inner` (`overflow: hidden; min-height: 0;`) so the row can genuinely animate from zero height. Also added a `visibility` transition with a delay so the collapsed input isn't keyboard-focusable when hidden.

### Round 5 — homepage header positioning

**"The header should be positioned absolutely so that it covers the hero section and doesn't have its own background (besides the pill's) — homepage specifically."** Changed `.site-header--overlay` from `position: sticky` + a `margin-bottom: -96px` compensation hack to `position: absolute; left: 0; right: 0;`, fully removing it from document flow so the hero section renders in its natural place and the header floats on top of it via `z-index`. `.site-header` itself already had no background set (confirmed — only `.site-header__pill` has `background-color`), so that part was already correct. Initial `top` value was set to `36px` (matching the announcement bar's own height) with a `32px` override at the announcement bar's own 749px breakpoint, reasoned from an earlier Figma metadata observation that the header and hero share the same y-coordinate below the announcement bar.

**Known tradeoff flagged to the user but not yet resolved either way:** switching from `sticky` to `absolute` means the header now scrolls away with the hero on the homepage instead of staying pinned to the viewport top while scrolling — if persistent nav access while scrolled is wanted, that needs a different approach (e.g., re-enabling sticky past a scroll threshold via JS), which has not been built.

### Round 6 — header top offset correction

**"`top` property of `.site-header--overlay` should be `0` when floating pill style."** Simplified further: removed the `36px`/`32px` announcement-bar-matching offset entirely and the corresponding 749px media-query override, so `.site-header--overlay { top: 0; }` applies uniformly at every breakpoint. This means the header/pill now overlaps the announcement bar's own space at the very top of the page (this was requested explicitly and implemented literally as asked).

### Round 7 — cart drawer open animation fix (most recent)

**"The cart drawer has a smooth transition when closing but not when opening; the nav drawer is fine."** Both drawers used an identical double-`requestAnimationFrame` pattern, but the cart drawer is the only one that can also open from a non-click trigger (the `cart:updated` custom event dispatched after a successful add-to-cart), making it more susceptible to a first-paint timing race where the browser's very first `showModal()` paint can skip straight to the end state with no transition. Fixed in `assets/cart-drawer.js` by replacing the double-rAF with a forced synchronous style flush (`panel.getBoundingClientRect()`) immediately after `showModal()`, guaranteeing the closed (off-screen) transform is committed before the `is-open` class is added — more reliable than frame-timing assumptions. The nav drawer's script was intentionally left untouched since it wasn't reported as broken.

**Verification gap:** none of Round 4 through Round 7's visual/animation changes have been confirmed via live browser screenshot — the Chrome DevTools MCP tool has been consistently locked by a concurrent session's Chrome profile throughout these rounds (see section 2.5). All of these were verified only via `shopify theme check` (Liquid/JSON syntax) and manual code-logic review, not visual confirmation. **This is the single highest-priority thing to manually verify next**, especially: the cart drawer open animation fix (Round 7), the homepage header's `top: 0` overlap with the announcement bar (Round 6), and the sticky→absolute scroll-away behavior change (Round 5).

---

## 4. Known gaps / deferred items

- **Featured Collection section has no collection selected** — `templates/index.json`'s `featured-collection` section settings have no `collection` value, so `sections/featured-collection.liquid`'s `{% if section.settings.collection.products.size > 0 %}` guard renders nothing. This is a content/data decision for the user to make via the theme editor — not something to fix in code. (Per section 2.1, this JSON file must not be edited from local anyway.)
- **Blog and Article templates** are untouched Skeleton scaffold defaults, per the user's explicit "Skip for now" choice — no matching Figma frames exist for them.
- **Shopify MCP connector** has never successfully authenticated across any session on this project — treat `mcp__claude_ai_Shopify__*` tools as unavailable until proven otherwise.
- **Remaining unused legacy files** from the Skeleton scaffold, never wired into any template: `sections/404.liquid`, `sections/article.liquid`, `sections/blog.liquid`, `sections/collection.liquid`, `sections/collections.liquid`, `sections/custom-section.liquid`, `sections/hello-world.liquid`, `sections/page.liquid`, `sections/password.liquid`, `sections/product.liquid`, `sections/search.liquid`, `assets/shoppy-x-ray.svg`, `templates/blog.json`, `templates/article.json`.
- **No git commits exist yet** despite `.git` now being initialized — everything is currently untracked. Worth deciding whether/when to make an initial commit.

---

## 5. Quick reference — key files touched across all rounds

- `sections/header.liquid` — header markup/CSS/JS (icon order, overlay positioning, search bar, mobile nav drawer)
- `sections/cart-drawer.liquid` + `assets/cart-drawer.js` — global cart drawer, AJAX cart, open/close animation
- `sections/footer.liquid` — logo, newsletter form layout, social icon hovers
- `sections/main-product.liquid`, `snippets/product-card.liquid`, `assets/main-product.js`, `assets/product-quick-add.js` — product add-to-cart flow
- `sections/main-cart.liquid`, `snippets/cart-line-item.liquid`, `assets/cart-items.js` — full `/cart` page
- `sections/contact-form.liquid`, `sections/main-page.liquid` — contact/page layout and link styling
- `sections/hero.liquid`, `sections/featured-collection.liquid`, `sections/selling-points.liquid`, `sections/testimonials.liquid` — homepage sections
- `assets/critical.css` — shared cart-line styles, global CSS reset, reduced-motion overrides
- `snippets/css-variables.liquid`, `config/settings_schema.json` — design token system

---

## 6. Suggested first actions for the picking-up session

1. Read this file in full (done, if you're reading this).
2. Run `shopify theme list --store seance-matcha.myshopify.com` to confirm current theme roles/ids haven't changed.
3. Ask the user whether Rounds 4–7 (drawer animations, header positioning) have been visually verified yet — if not, that's the top priority before any new feature work.
4. Re-read section 2 (critical operating rules) before running any `shopify theme` command.
