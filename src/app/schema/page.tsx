/**
 * @file src/app/schema/page.tsx
 * @purpose Dedicated Database Schema Explorer route (/schema) auto-synced with prisma/schema.prisma on every build.
 */

import schemaMeta from "@shared/generated/schema-meta.json";
import { SchemaExplorerClient } from "@modules/schema-visualizer/components/SchemaExplorerClient";
import type { SchemaMeta } from "@modules/schema-visualizer/schema";
import { AdminAuthGuard } from "@shared/components/AdminAuthGuard";

export default function SchemaExplorerPage() {
  return (
    <AdminAuthGuard>
      <SchemaExplorerClient meta={schemaMeta as SchemaMeta} />
    </AdminAuthGuard>
  );
}
