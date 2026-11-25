/**
 * @file src/shared/db/supabase-rest.ts
 * @purpose Lightweight Supabase PostgREST client for real-time shared reads/writes across Storefront, Admin Portal, and multiple Owner devices.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://rjwthvvvmlkchjmwjixv.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_UoGGs_Febjhywr_LxLIq5A_v1lmZl1r";

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function sbSelect<T>(
  table: string,
  query = "select=*"
): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase select ${table} failed: ${res.status}`);
  }
  return (await res.json()) as T[];
}

export async function sbPatch<T>(
  table: string,
  filterQuery: string,
  patch: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterQuery}`, {
    method: "PATCH",
    headers: getHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Supabase patch ${table} failed: ${res.status}`);
  }
  return (await res.json()) as T[];
}

export async function sbInsert<T>(
  table: string,
  payload: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: getHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert ${table} failed: ${res.status}`);
  }
  return (await res.json()) as T[];
}

export async function sbDelete(
  table: string,
  filterQuery: string
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterQuery}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Supabase delete ${table} failed: ${res.status}`);
  }
}
