# ROOM Storefront — Isolated Systems & Architecture Registry

> **Living Registry Rule:** Whenever a new isolated system, data manager, or core module is created in this repository (including in future sessions), add or update its entry in this file with its exact route, isolated Supabase key, public APIs, data flow, and architectural purpose.

---

## Architecture Principles

1. **Vaults / Organizers (مستودعات البيانات المعزولة):**
   Each domain has an isolated Admin Editor page and a dedicated JSON registry stored inside Supabase `page_sections` under a reserved `__isolated_*` `pageKey` (`isVisible: false`), plus a fast `localStorage` read cache.
2. **Homepage Composer Boundary (العزل الكامل للواجهة الرئيسية):**
   The Homepage (`/`) NEVER imports item Vaults (`universe-organizer`, `product-organizer`, `package-organizer`, `element-organizer`) directly. Only `@modules/home-composer` resolves placed items and feeds `/` through `fetchResolvedHomepageForStorefront()`.
3. **Inner Pages Direct Resolvers:**
   Each entity's dedicated detail page (`/universe/`, `/product/`, `/package/`) reads from its own module's public read API.

---

## Complete Systems Directory

| # | System Name | Module Path | Admin Route | Supabase Storage Key | Public Reader API | Consumed By | Purpose & Why It Was Built |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Universe Data Manager** | `src/modules/universe-organizer/` | `/admin/universes/` | `page_sections` (`id = uorg_isolated_registry_v1`, `pageKey = __isolated_universe_organizer_v1__`) | `fetchResolvedUniversesForStorefront()`, `fetchResolvedUniverseDetail(slug)` | `/universe/`, `/universes/[slug]`, `UniverseThemeSync`, & `@modules/home-composer` | Isolated management of Universe cards, accents, PNG star icons, and assigned products/collections without touching legacy tables or theme leaks. |
| 2 | **Product Data Manager** | `src/modules/product-organizer/` | `/admin/products/` | `page_sections` (`id = porg_isolated_registry_v1`, `pageKey = __isolated_product_organizer_v1__`) | `fetchResolvedProductsForStorefront()`, `fetchResolvedProductDetail(slug)` | `/product/`, `UniverseDetailClient`, `PackageDetailClient`, & `@modules/home-composer` | Isolated control over outer product card image framing (`cover`/`contain`/position), price, stock/Vaulted state, gallery images, specs, and inner layout. |
| 3 | **Packages & Collections Data Manager** | `src/modules/package-organizer/` | `/admin/packages/` | `page_sections` (`id = korg_isolated_registry_v1`, `pageKey = __isolated_package_organizer_v1__`) | `fetchResolvedPackagesForStorefront()`, `fetchResolvedPackageDetail(slug)` | `/package/`, `UniverseDetailClient`, & `@modules/home-composer` | Manages bundled Loadouts & curated Collections, outer banner framing, inner full-bleed hero image, pricing modes, and member product lists. |
| 4 | **Reading Cards & Buttons Studio** | `src/modules/element-organizer/` | `/admin/elements/` | `page_sections` (`id = eorg_isolated_registry_v1`, `pageKey = __isolated_element_organizer_v1__`) | `fetchResolvedElementsForStorefront()`, `getCachedOrganizerElements()` | `/admin/home/` Side Panels 4 & 5, `HomeComposerBlockRenderer` | Creates content-hugging frosted Reading Text Cards (with independent per-line Eyebrow/Title/Subtitle font scales + optional positioned CTA button) and standalone Reusable Buttons. |
| 5 | **Isolated Homepage Composer** | `src/modules/home-composer/` | `/admin/home/` & `/admin/editor/` | `page_sections` (`id = hcomp_isolated_registry_v1`, `pageKey = __isolated_home_composer_v1__`) | `fetchResolvedHomepageForStorefront()`, `getCachedHomepageSnapshot()` | Storefront Homepage `/` (`StorefrontHomeClient`) | Strictly governs the Homepage layout: Block headers, RTL/LTR start flow, mobile (1-5/auto) & desktop (1-6/auto) responsive grids, per-item width/alignment, customizable Dividers, and 5 connected Vault panels. Prevents unplaced Vault items from bypassing layout control. |
| 6 | **Active Database & Flow Visualizer** | `src/modules/schema-visualizer/` | `/schema/` | Reads live metadata (`schema-meta.json`) + all 8 active Supabase tables & 5 isolated keys | Client-side interactive Graph & Flow Inspector | Developer / Owner Admin Tooling (`/schema/`) | Interactive ER graph + Domain-organized Data Flow Tracer showing Writers, Storage Tables/Schemas, APIs, Consumers, FK resolution, and raw JSON payloads across only active sources. |
| 7 | **Store Config & Theme Engine** | `src/modules/store-config/` & `src/shared/components/UniverseThemeSync.tsx` | `/admin/` (Store Tab) | `store_configs` (`slug = room-egypt`) | `getActiveStoreConfig()`, CSS `--color-*` tokens & `room_theme_snapshot_v1` | Global Root `layout.tsx`, `/admin/` | Stores brand identity, WhatsApp, dark background tokens, accent presets, and pre-paint anti-flash theme hydration. |
| 8 | **Admin Auth, Team & 48h Invites** | `src/modules/admin/` | `/admin/`, `/admin/invite/` | `users`, `admin_invites` | `AdminPortalClient`, `AdminInviteClient` | Owner / Admin onboarding & session management | Manages Owner/Admin/Staff accounts, RBAC role & active toggling, SHA-256 credentials, and single-use 48-hour invite links. |
| 9 | **Isolated Cart, Checkout & Promos** | `src/modules/cart-checkout/` | `/admin/checkout/` | `page_sections` (`id = ckorg_isolated_registry_v1`, `pageKey = __isolated_cart_checkout_v1__`), `orders`, `order_items`, `shipping_zones` | `useRoomBagStore`, `fetchCheckoutOrganizerSnapshot()`, `submitCheckoutOrder()` | Global `MyRoomTriggerAndDrawer`, `/product/` Buy Now, `/admin/checkout/` | Completely isolated Checkout configuration (payment methods, promo codes, rules, dynamic labels) + atomic order creation into `orders`/`order_items`, isolated stock decrement, and WhatsApp receipt generation. |
| 10 | **Analytics & Future Ops Telemetry** | `src/modules/analytics/` | `/admin/` (Analytics Tab) & `/schema/` | `page_sections` (`__isolated_analytics_v1__`, `__isolated_future_ops_v1__`) + Prisma models | `trackStorefrontEvent()`, `<TrackingScripts />`, `<AnalyticsDashboardPanel />` | Storefront (GA4/Pixel + Telemetry), `/admin/`, `/schema/` | Zero-static funnel telemetry, SVG revenue charts, GA4/Meta Pixel runtime injection, and pre-wired Operational Ledger. |
| 11 | **Product Reviews & Comments** | `src/modules/reviews/` | `/admin/reviews/` | `page_sections` (`id = rev_isolated_registry_v1`, `pageKey = __isolated_reviews_v1__`) | `fetchApprovedProductReviews()`, `submitProductReview()`, `<ProductReviewsSection />` | `/product/?slug=...`, `/admin/reviews/` | Customer ratings (1-5 stars), distribution breakdown, comment submission, verified badges, and Admin moderation/replies. |
| 12 | **Separated Policies, FAQ & Contact** | `src/modules/policies/` | `/admin/policies/` | `page_sections` (`id = pol_isolated_registry_v1`, `pageKey = __isolated_policies_v1__`) | `fetchPoliciesSnapshot()`, `<PolicyPageClient kind="..." />` | `/policies/returns/`, `/policies/shipping/`, `/policies/privacy/`, `/policies/terms/`, `/faq/`, `/contact/` | Strictly separated per-page legal/trust documents, categorized FAQ accordion, and store-linked Contact page. |

---

## Detailed Data Flow Map

### Flow A: Creating & Displaying Content on the Homepage (`/`)
1. **Create Elements in Vaults**:
   - Universe created/edited at `/admin/universes/` -> saved in `__isolated_universe_organizer_v1__`
   - Product created/edited at `/admin/products/` -> saved in `__isolated_product_organizer_v1__`
   - Package/Collection created/edited at `/admin/packages/` -> saved in `__isolated_package_organizer_v1__`
   - Reading Card / Button created/edited at `/admin/elements/` -> saved in `__isolated_element_organizer_v1__`
2. **Compose Homepage Layout**:
   - Admin opens `/admin/home/` -> Composer reads all 4 Vaults into its 5 side lists (Universes, Products, Collections, Reading Text Cards, Buttons + Editable Divider).
   - Admin arranges Blocks, Columns (`mobileCols` / `desktopCols`), Direction (`ltr`/`rtl`), Item Width/Alignment, and Dividers -> saved strictly in `__isolated_home_composer_v1__`.
3. **Storefront Homepage (`/`) Rendering**:
   - `src/app/page.tsx` -> `<StorefrontHomeClient />` calls **only** `fetchResolvedHomepageForStorefront()` in `@modules/home-composer`.
   - `@modules/home-composer` returns only placed items inside visible blocks (hydrated with latest prices/images/stock from the Vaults) and renders them identically to `/admin/home/` preview via `HomeComposerBlockRenderer`.

### Flow B: Inner Storefront Pages
- `/universe/?slug=...` & `/universes/[slug]` -> `@modules/universe-organizer` (`fetchResolvedUniverseDetail(slug)`) + `@modules/product-organizer`
- `/product/?slug=...` -> `@modules/product-organizer` (`fetchResolvedProductDetail(slug)`)
- `/package/?slug=...` -> `@modules/package-organizer` (`fetchResolvedPackageDetail(slug)`) + `@modules/product-organizer`
