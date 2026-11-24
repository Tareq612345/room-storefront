/**
 * @file src/modules/schema-visualizer/schema.ts
 * @purpose TypeScript interfaces for auto-generated Prisma schema metadata consumed by the Schema Explorer UI.
 */

export interface FieldMeta {
  name: string;
  type: string;
  rawType: string;
  isList: boolean;
  isOptional: boolean;
  isId: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  isModelRelation?: boolean;
  isEnum?: boolean;
  defaultValue: string | null;
  relationTo: string | null;
  relationFields: string[];
}

export interface ModelMeta {
  name: string;
  tableName: string;
  domain: string;
  position: { x: number; y: number };
  fields: FieldMeta[];
  indexes: string[];
  uniques: string[];
}

export interface EnumMeta {
  name: string;
  values: string[];
}

export interface EdgeMeta {
  id: string;
  from: string;
  to: string;
  field: string;
  fkFields: string[];
}

export interface SchemaMeta {
  generatedAt: string;
  provider: string;
  stats: {
    modelsCount: number;
    enumsCount: number;
    edgesCount: number;
    fieldsCount: number;
  };
  enums: EnumMeta[];
  models: ModelMeta[];
  edges: EdgeMeta[];
}
