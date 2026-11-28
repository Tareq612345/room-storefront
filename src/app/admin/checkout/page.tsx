/**
 * @file src/app/admin/checkout/page.tsx
 * @purpose Dedicated Isolated Admin Cart & Checkout Studio route (/admin/checkout/).
 */

import { CheckoutOrganizerClient } from "@modules/cart-checkout";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default function AdminCheckoutOrganizerPage() {
  return (
    <AdminAuthGuard>
      <CheckoutOrganizerClient />
    </AdminAuthGuard>
  );
}
