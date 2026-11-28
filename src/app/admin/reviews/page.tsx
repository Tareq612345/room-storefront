/**
 * @file src/app/admin/reviews/page.tsx
 * @purpose Dedicated Isolated Product Reviews Moderation Studio (/admin/reviews/).
 */

import { ReviewsOrganizerClient } from "@modules/reviews";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default function AdminReviewsPage() {
  return (
    <AdminAuthGuard>
      <ReviewsOrganizerClient />
    </AdminAuthGuard>
  );
}
