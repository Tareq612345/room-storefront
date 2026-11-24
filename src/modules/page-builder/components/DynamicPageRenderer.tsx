import { sectionRegistry } from "@shared/registry/section-registry";
import type { PageSectionDTO } from "../schema";

interface DynamicPageRendererProps {
  sections: PageSectionDTO[];
}

/**
 * Renders database-configured PageSections via the plug-and-play SectionRegistry.
 */
export function DynamicPageRenderer({ sections }: DynamicPageRendererProps) {
  return (
    <div className="flex flex-col">
      {sections.map((section) => {
        const Component = sectionRegistry.get(section.type);
        if (!Component) {
          return null;
        }

        return (
          <Component
            key={section.id}
            sectionId={section.id}
            storeId={section.storeId}
            title={section.title}
            subtitle={section.subtitle}
            config={section.config}
          />
        );
      })}
    </div>
  );
}
