import type { ComponentType } from "react";

export type PageSectionTypeKey =
  | "HERO_SLIDER"
  | "UNIVERSE_QUICK_BAR"
  | "TRENDING_CAROUSEL"
  | "FEATURED_BUNDLES"
  | "FLASH_DEALS"
  | "CATEGORY_SPOTLIGHT"
  | "BEST_SELLERS"
  | "NEW_ARRIVALS"
  | "CUSTOMER_SETUPS";

export interface RegisteredSectionProps {
  sectionId: string;
  storeId: string;
  title: string | null;
  subtitle: string | null;
  config: Record<string, unknown>;
}

export type SectionComponent = ComponentType<RegisteredSectionProps>;

class SectionRegistry {
  private registry = new Map<PageSectionTypeKey, SectionComponent>();

  register(type: PageSectionTypeKey, component: SectionComponent): void {
    this.registry.set(type, component);
  }

  get(type: PageSectionTypeKey): SectionComponent | undefined {
    return this.registry.get(type);
  }

  has(type: PageSectionTypeKey): boolean {
    return this.registry.has(type);
  }

  listRegisteredTypes(): PageSectionTypeKey[] {
    return Array.from(this.registry.keys());
  }
}

export const sectionRegistry = new SectionRegistry();
