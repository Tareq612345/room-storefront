import { PoliciesOrganizerClient } from "@modules/policies";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default function AdminPoliciesPage() {
  return (
    <AdminAuthGuard>
      <PoliciesOrganizerClient />
    </AdminAuthGuard>
  );
}
