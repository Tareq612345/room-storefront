/**
 * @file src/app/page.tsx
 * @purpose Storefront Homepage (/): consumes layout & content exclusively through the Isolated Homepage Composer (@modules/home-composer).
 */

import { StorefrontHomeClient } from "@modules/home-composer";

export default function HomePage() {
  return <StorefrontHomeClient />;
}
