/**
 * @file scripts/generate-schema-meta.mjs
 * @purpose Automatically parses prisma/schema.prisma into src/shared/generated/schema-meta.json on every build so the Schema Visualizer stays 100% synced with database updates.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");
const outDir = path.join(root, "src", "shared", "generated");
const outPath = path.join(outDir, "schema-meta.json");

const raw = fs.readFileSync(schemaPath, "utf8");
const lines = raw.split(/\r?\n/);

const enums = [];
const models = [];

let currentEnum = null;
let currentModel = null;

const DOMAIN_MAP = {
  StoreConfig: "Core & Multi-Tenant",
  User: "Core & Multi-Tenant",
  AdminInvite: "Core & Multi-Tenant",
  PageSection: "Dynamic Page Builder",
  Universe: "Universes",
  Product: "Catalog & A+ Story",
  ProductVariant: "Catalog & A+ Story",
  ProductStoryBlock: "Catalog & A+ Story",
  Bundle: "Loadouts (Bundles)",
  BundleItem: "Loadouts (Bundles)",
  ShippingZone: "Orders & Cairo Shipping",
  Order: "Orders & Cairo Shipping",
  OrderItem: "Orders & Cairo Shipping",
  LoyaltyAccount: "Loyalty & Rewards",
};

const DEFAULT_POSITIONS = {
  AdminInvite: { x: 40, y: 40 },
  StoreConfig: { x: 40, y: 340 },
  PageSection: { x: 40, y: 660 },
  ShippingZone: { x: 40, y: 980 },
  User: { x: 410, y: 40 },
  Universe: { x: 410, y: 340 },
  Bundle: { x: 410, y: 660 },
  Order: { x: 410, y: 980 },
  LoyaltyAccount: { x: 780, y: 40 },
  Product: { x: 780, y: 340 },
  BundleItem: { x: 780, y: 680 },
  OrderItem: { x: 780, y: 980 },
  ProductVariant: { x: 1150, y: 220 },
  ProductStoryBlock: { x: 1150, y: 540 },
};

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line || line.startsWith("//")) continue;

  const enumMatch = line.match(/^enum\s+(\w+)\s*\{/);
  if (enumMatch) {
    currentEnum = { name: enumMatch[1], values: [] };
    continue;
  }

  const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
  if (modelMatch) {
    const name = modelMatch[1];
    currentModel = {
      name,
      tableName: name.toLowerCase(),
      domain: DOMAIN_MAP[name] || "Domain",
      position: DEFAULT_POSITIONS[name] || { x: 100 + models.length * 180, y: 140 },
      fields: [],
      indexes: [],
      uniques: [],
    };
    continue;
  }

  if (line === "}") {
    if (currentEnum) {
      enums.push(currentEnum);
      currentEnum = null;
    } else if (currentModel) {
      models.push(currentModel);
      currentModel = null;
    }
    continue;
  }

  if (currentEnum) {
    const val = line.split(/\s+/)[0];
    if (val) currentEnum.values.push(val);
    continue;
  }

  if (currentModel) {
    const mapMatch = line.match(/^@@map\("([^"]+)"\)/);
    if (mapMatch) {
      currentModel.tableName = mapMatch[1];
      continue;
    }

    const indexMatch = line.match(/^@@index\(\[([^\]]+)\]\)/);
    if (indexMatch) {
      currentModel.indexes.push(indexMatch[1].replace(/\s+/g, " "));
      continue;
    }

    const uniqueMatch = line.match(/^@@unique\(\[([^\]]+)\]\)/);
    if (uniqueMatch) {
      currentModel.uniques.push(uniqueMatch[1].replace(/\s+/g, " "));
      continue;
    }

    if (line.startsWith("@@")) continue;

    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const fieldName = parts[0];
      const rawType = parts[1];
      const isList = rawType.endsWith("[]");
      const isOptional = rawType.endsWith("?");
      const baseType = rawType.replace(/[\[\]?]/g, "");
      const attrs = parts.slice(2).join(" ");

      const defaultMatch = attrs.match(/@default\(([^)]+)\)/);
      const relationMatch = attrs.match(/@relation\(fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]/);

      currentModel.fields.push({
        name: fieldName,
        type: baseType,
        rawType,
        isList,
        isOptional,
        isId: attrs.includes("@id"),
        isUnique: attrs.includes("@unique"),
        isForeignKey: false,
        defaultValue: defaultMatch ? defaultMatch[1] : null,
        relationTo: relationMatch ? baseType : null,
        relationFields: relationMatch ? relationMatch[1].split(",").map((s) => s.trim()) : [],
      });
    }
  }
}

const modelNames = new Set(models.map((m) => m.name));
const enumNames = new Set(enums.map((e) => e.name));
const edges = [];

for (const model of models) {
  const fkFieldNames = new Set();
  for (const f of model.fields) {
    if (f.relationFields.length > 0) {
      for (const fk of f.relationFields) fkFieldNames.add(fk);
      if (modelNames.has(f.type)) {
        edges.push({
          id: `${model.name}->${f.type}:${f.name}`,
          from: model.name,
          to: f.type,
          field: f.name,
          fkFields: f.relationFields,
        });
      }
    }
    f.isModelRelation = modelNames.has(f.type);
    f.isEnum = enumNames.has(f.type);
  }
  for (const f of model.fields) {
    if (fkFieldNames.has(f.name)) {
      f.isForeignKey = true;
    }
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  provider: "PostgreSQL (Supabase)",
  stats: {
    modelsCount: models.length,
    enumsCount: enums.length,
    edgesCount: edges.length,
    fieldsCount: models.reduce((acc, m) => acc + m.fields.length, 0),
  },
  enums,
  models,
  edges,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Generated schema-meta.json (${models.length} models, ${edges.length} relations, ${enums.length} enums).`);
