/**
 * @file prisma/seed.ts
 * @purpose Seeds the ROOM multi-tenant PostgreSQL database on Supabase with StoreConfig, Universes, Products, Variants, StoryBlocks, Loadouts, PageSections, and Cairo/New Cairo ShippingZones.
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding ROOM database...");

  // 1. StoreConfig
  const store = await prisma.storeConfig.upsert({
    where: { slug: "room-egypt" },
    update: {},
    create: {
      slug: "room-egypt",
      name: "ROOM",
      currency: "EGP",
      defaultAccentColor: "#ffffff",
      whatsappNumber: "+201000000000",
      supportEmail: "hello@room-eg.com",
      isActive: true,
      themeTokens: {
        bgPrimary: "#05030a",
        bgSecondary: "#0b0617",
        bgElevated: "#140b29",
        defaultAccent: "#ffffff",
      },
    },
  });

  // 1b. Seed Owners (tareq612345@gmail.com & adegddn@gmail.com)
  const owners = [
    {
      email: "tareq612345@gmail.com",
      username: "tareq",
      name: "Tareq (Owner)",
      defaultPass: "RoomOwner#2026",
    },
    {
      email: "adegddn@gmail.com",
      username: "adegddn",
      name: "Partner (Owner)",
      defaultPass: "RoomOwner#2026",
    },
  ];

  for (const owner of owners) {
    await prisma.user.upsert({
      where: { storeId_email: { storeId: store.id, email: owner.email } },
      update: { role: "OWNER" },
      create: {
        storeId: store.id,
        email: owner.email,
        username: owner.username,
        name: owner.name,
        role: "OWNER",
        passwordHash: hashPassword(owner.defaultPass),
        isActive: true,
      },
    });
  }

  // 2. Universes
  const cars = await prisma.universe.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "cars" } },
    update: {},
    create: {
      storeId: store.id,
      slug: "cars",
      name: "GARAGE & CARS",
      tagline: "Midnight Touge & Supercar Bedroom Loadouts",
      description:
        "High-craft automotive bedsheets, carbon-inspired textures, and pit-lane ambient setups built for Cairo car heads.",
      accentColor: "#d92323",
      bannerUrl: "/mockups/universe-cars.svg",
      sortOrder: 1,
      isActive: true,
    },
  });

  const gaming = await prisma.universe.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "gaming" } },
    update: {},
    create: {
      storeId: store.id,
      slug: "gaming",
      name: "GAMING ARENA",
      tagline: "Obsidian RGB & Next-Gen Battle Stations",
      description:
        "Sleek dark-mode bedsheets and full-room Loadouts engineered to frame your desk, monitor, and late-night ranked grinds.",
      accentColor: "#6366f1",
      bannerUrl: "/mockups/universe-gaming.svg",
      sortOrder: 2,
      isActive: true,
    },
  });

  const anime = await prisma.universe.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "anime" } },
    update: {},
    create: {
      storeId: store.id,
      slug: "anime",
      name: "ANIME REALM",
      tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes",
      description:
        "Signature anime-inspired bedsheets and collector room Loadouts that transform your space into your favorite arc.",
      accentColor: "#c94b99",
      bannerUrl: "/mockups/universe-anime.svg",
      sortOrder: 3,
      isActive: true,
    },
  });

  // 3. Products + Variants
  const tougeSheet = await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "midnight-touge-bedsheet" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: cars.id,
      slug: "midnight-touge-bedsheet",
      name: "Midnight Touge Carbon Bedsheet",
      subtitle: "300TC Matte Obsidian Cotton • Pit-Lane Red Piping",
      basePrice: 1450,
      compareAtPrice: 1750,
      thumbnailUrl: "/mockups/products/sheet-midnight-touge.svg",
      images: ["/mockups/products/sheet-midnight-touge.svg"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isActive: true,
      variants: {
        create: [
          {
            storeId: store.id,
            sku: "RM-TOUGE-SINGLE",
            name: "Single / 160x220 cm",
            size: "Single",
            colorName: "Obsidian Crimson",
            colorHex: "#d92323",
            price: 1250,
            compareAtPrice: 1500,
            stock: 10,
            isDefault: false,
          },
          {
            storeId: store.id,
            sku: "RM-TOUGE-KING",
            name: "King / 240x220 cm",
            size: "King",
            colorName: "Obsidian Crimson",
            colorHex: "#d92323",
            price: 1450,
            compareAtPrice: 1750,
            stock: 18,
            isDefault: true,
          },
        ],
      },
    },
  });

  const rankedSheet = await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "obsidian-ranked-bedsheet" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: gaming.id,
      slug: "obsidian-ranked-bedsheet",
      name: "Obsidian Ranked Arena Bedsheet",
      subtitle: "Stealth Micro-Weave • Indigo Stitch Matrix",
      basePrice: 1390,
      thumbnailUrl: "/mockups/products/sheet-obsidian-ranked.svg",
      images: ["/mockups/products/sheet-obsidian-ranked.svg"],
      isFeatured: true,
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          {
            storeId: store.id,
            sku: "RM-RANKED-KING",
            name: "King / 240x220 cm",
            size: "King",
            colorName: "Midnight Indigo",
            colorHex: "#6366f1",
            price: 1390,
            stock: 12,
            isDefault: true,
          },
        ],
      },
    },
  });

  const eclipseSheet = await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "neo-tokyo-eclipse-sheet" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: anime.id,
      slug: "neo-tokyo-eclipse-sheet",
      name: "Neo-Tokyo Eclipse Bedsheet",
      subtitle: "Brushed Dark Sateen • Orchid Embroidered Crest",
      basePrice: 1550,
      compareAtPrice: 1890,
      thumbnailUrl: "/mockups/products/sheet-neo-tokyo.svg",
      images: ["/mockups/products/sheet-neo-tokyo.svg"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isActive: true,
      variants: {
        create: [
          {
            storeId: store.id,
            sku: "RM-ECLIPSE-KING",
            name: "King / 240x220 cm",
            size: "King",
            colorName: "Obsidian Orchid",
            colorHex: "#c94b99",
            price: 1550,
            compareAtPrice: 1890,
            stock: 9,
            isDefault: true,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "apex-gt-pillow-set" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: cars.id,
      slug: "apex-gt-pillow-set",
      name: "Apex GT Twin Pillowcase Pair",
      subtitle: "Limited Cairo Drop • Heavyweight Weave",
      basePrice: 590,
      thumbnailUrl: "/mockups/products/pillows-apex-gt.svg",
      images: ["/mockups/products/pillows-apex-gt.svg"],
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          {
            storeId: store.id,
            sku: "RM-APEX-PILLOWS",
            name: "Standard Pair (50x75 cm)",
            size: "Standard",
            colorName: "Obsidian Crimson",
            colorHex: "#d92323",
            price: 590,
            stock: 0, // Vaulted
            isDefault: true,
          },
        ],
      },
    },
  });

  // 4. Cairo & New Cairo Shipping Zones
  const zones = [
    { name: "New Cairo (5th Settlement / Rehab / Madinaty)", fee: 65, freeShippingThreshold: 2500, estimatedDays: "1-2 Days", sortOrder: 1 },
    { name: "Nasr City & Heliopolis", fee: 60, freeShippingThreshold: 2500, estimatedDays: "1-2 Days", sortOrder: 2 },
    { name: "Maadi & Zamalek", fee: 65, freeShippingThreshold: 2500, estimatedDays: "1-2 Days", sortOrder: 3 },
    { name: "6th of October & Sheikh Zayed", fee: 85, freeShippingThreshold: 3000, estimatedDays: "2-3 Days", sortOrder: 4 },
  ];

  for (const z of zones) {
    await prisma.shippingZone.upsert({
      where: { storeId_name: { storeId: store.id, name: z.name } },
      update: {},
      create: {
        storeId: store.id,
        name: z.name,
        city: "Cairo",
        fee: z.fee,
        freeShippingThreshold: z.freeShippingThreshold,
        estimatedDays: z.estimatedDays,
        sortOrder: z.sortOrder,
        isActive: true,
      },
    });
  }

  // 5. Featured Loadouts (Bundles)
  await prisma.bundle.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "midnight-touge-loadout" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: cars.id,
      slug: "midnight-touge-loadout",
      name: "Midnight Touge Full Loadout",
      tagline: "Fitted Sheet + Duvet Cover + 2 Apex Pillowcases",
      thumbnailUrl: "/mockups/universe-cars.svg",
      pricingType: "FIXED_PRICE",
      fixedPrice: 2350,
      isFeatured: true,
      isActive: true,
      items: {
        create: [
          { storeId: store.id, productId: tougeSheet.id, quantity: 1, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.bundle.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "obsidian-ranked-loadout" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: gaming.id,
      slug: "obsidian-ranked-loadout",
      name: "Obsidian Ranked Room Loadout",
      tagline: "Stealth Bedsheet Set + Ambient Desk Glow",
      thumbnailUrl: "/mockups/universe-gaming.svg",
      pricingType: "FIXED_PRICE",
      fixedPrice: 2150,
      isFeatured: true,
      isActive: true,
      items: {
        create: [
          { storeId: store.id, productId: rankedSheet.id, quantity: 1, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.bundle.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "neo-tokyo-collector-loadout" } },
    update: {},
    create: {
      storeId: store.id,
      universeId: anime.id,
      slug: "neo-tokyo-collector-loadout",
      name: "Neo-Tokyo Collector Loadout",
      tagline: "Eclipse Sateen Set + Embroidered Throw",
      thumbnailUrl: "/mockups/universe-anime.svg",
      pricingType: "FIXED_PRICE",
      fixedPrice: 2490,
      isFeatured: true,
      isActive: true,
      items: {
        create: [
          { storeId: store.id, productId: eclipseSheet.id, quantity: 1, sortOrder: 1 },
        ],
      },
    },
  });

  console.log("ROOM database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
