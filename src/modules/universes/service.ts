import { UniverseSchema, type UniverseDTO } from "./schema";
import { findActiveUniverses, findUniverseBySlug } from "./repository";

const FALLBACK_UNIVERSES: UniverseDTO[] = [
  {
    id: "univ_cars",
    storeId: "store_room_egypt",
    slug: "cars",
    name: "GARAGE & CARS",
    tagline: "Midnight Touge & Supercar Bedroom Loadouts",
    description:
      "High-craft automotive bedsheets, carbon-inspired textures, and pit-lane ambient setups built for Cairo car heads.",
    accentColor: "#d92323",
    iconUrl: null,
    bannerUrl: "/mockups/universe-cars.svg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "univ_gaming",
    storeId: "store_room_egypt",
    slug: "gaming",
    name: "GAMING ARENA",
    tagline: "Obsidian RGB & Next-Gen Battle Stations",
    description:
      "Sleek dark-mode bedsheets and full-room Loadouts engineered to frame your desk, monitor, and late-night ranked grinds.",
    accentColor: "#6366f1",
    iconUrl: null,
    bannerUrl: "/mockups/universe-gaming.svg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "univ_anime",
    storeId: "store_room_egypt",
    slug: "anime",
    name: "ANIME REALM",
    tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes",
    description:
      "Signature anime-inspired bedsheets and collector room Loadouts that transform your space into your favorite arc.",
    accentColor: "#c94b99",
    iconUrl: null,
    bannerUrl: "/mockups/universe-anime.svg",
    sortOrder: 3,
    isActive: true,
  },
];

export async function listStoreUniverses(
  storeId: string
): Promise<UniverseDTO[]> {
  try {
    const rows = await findActiveUniverses(storeId);
    if (rows.length === 0) {
      return FALLBACK_UNIVERSES.map((u) => ({ ...u, storeId }));
    }
    return rows.map((row) => UniverseSchema.parse(row));
  } catch {
    return FALLBACK_UNIVERSES.map((u) => ({ ...u, storeId }));
  }
}

export async function getUniverseBySlug(
  storeId: string,
  slug: string
): Promise<UniverseDTO | null> {
  try {
    const row = await findUniverseBySlug(storeId, slug);
    if (row) return UniverseSchema.parse(row);
  } catch {
    // Fallback below
  }

  return (
    FALLBACK_UNIVERSES.find((u) => u.slug === slug) ?? null
  );
}
