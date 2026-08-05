import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;
type OffloaderItemRow = Database["public"]["Tables"]["offloader_items"]["Row"];

export type OffloaderItem = {
  id: string;
  parentId: string | null;
  content: string;
  done: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

// A gap's decimal expansion (from repeated bisection between the same two
// neighbors) beyond this many digits triggers a sibling-group renormalize.
const MAX_POSITION_DECIMAL_DIGITS = 20;

const ContentSchema = z.string().trim().min(1).max(2000);
const IdSchema = z.string().uuid();
const NullableIdSchema = z.string().uuid().nullable();

function toItem(row: OffloaderItemRow): OffloaderItem {
  return {
    id: row.id,
    parentId: row.parent_id,
    content: row.content,
    done: row.done,
    position: Number(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Direct-children-only gate: an item can be marked done or deleted only once
 * every direct child is itself done or removed. Marking done is gated by
 * this same rule, so a done item can never have an un-done descendant. */
async function hasUndoneChildren(supabase: DB, userId: string, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("offloader_items")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_id", id)
    .eq("done", false)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Position arithmetic must be exact. Postgres `numeric` is arbitrary-
// precision decimal, but the default PostgREST JSON encoding of a numeric
// column round-trips through a JS double, capping precision at ~15-17
// significant digits — enough repeated bisection between the same two
// neighbors would silently collide well before MAX_POSITION_DECIMAL_DIGITS
// is ever reached. Reads that feed into bisection cast to text (`::text`)
// so PostgREST returns the exact decimal string instead of a lossy JSON
// number; all arithmetic below is BigInt-based on that string. Writes send
// the resulting string back — Postgres coerces a numeric-looking string in
// a JSON body to `numeric` without an intermediate float.
type Decimal = { unscaled: bigint; scale: number };

function parseDecimal(s: string): Decimal {
  const negative = s.startsWith("-");
  const raw = negative ? s.slice(1) : s;
  const [intPart, fracPart = ""] = raw.split(".");
  const unscaled = (negative ? -1n : 1n) * BigInt((intPart || "0") + fracPart);
  return { unscaled, scale: fracPart.length };
}

function decimalToString({ unscaled, scale }: Decimal): string {
  const negative = unscaled < 0n;
  let digits = (negative ? -unscaled : unscaled).toString();
  if (scale === 0) return (negative ? "-" : "") + digits;
  while (digits.length <= scale) digits = "0" + digits;
  const intPart = digits.slice(0, digits.length - scale) || "0";
  const fracPart = digits.slice(digits.length - scale).replace(/0+$/, "");
  return (negative ? "-" : "") + intPart + (fracPart ? "." + fracPart : "");
}

function rescale(d: Decimal, scale: number): bigint {
  return d.scale === scale ? d.unscaled : d.unscaled * 10n ** BigInt(scale - d.scale);
}

/** Exact midpoint of two decimal strings — no rounding, ever. At a shared
 * scale s, average = sum / (2 * 10^s); expressed at scale s+1 that's
 * exactly sum * 5, an integer, so there is nothing to round away. */
function midpointDecimal(aStr: string, bStr: string): Decimal {
  const a = parseDecimal(aStr);
  const b = parseDecimal(bStr);
  const scale = Math.max(a.scale, b.scale);
  const sum = rescale(a, scale) + rescale(b, scale);
  return { unscaled: sum * 5n, scale: scale + 1 };
}

function plusOne(aStr: string): Decimal {
  const a = parseDecimal(aStr);
  return { unscaled: a.unscaled + 10n ** BigInt(a.scale), scale: a.scale };
}

function minusOne(aStr: string): Decimal {
  const a = parseDecimal(aStr);
  return { unscaled: a.unscaled - 10n ** BigInt(a.scale), scale: a.scale };
}

/** `position` is `numeric` in Postgres, but the Supabase-generated Insert/
 * Update types model it as `number` — these writes intentionally send the
 * exact decimal string instead, which Postgres coerces losslessly. */
function asPositionValue(d: Decimal): number {
  return decimalToString(d) as unknown as number;
}

async function nextPosition(supabase: DB, userId: string, parentId: string | null) {
  const base = supabase
    .from("offloader_items")
    .select("position::text")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1);
  const { data, error } =
    parentId === null ? await base.is("parent_id", null) : await base.eq("parent_id", parentId);
  if (error) throw error;
  const max = data?.[0]?.position as unknown as string | undefined;
  return asPositionValue(plusOne(max ?? "0"));
}

async function renormalizeSiblings(supabase: DB, userId: string, parentId: string | null) {
  const base = supabase
    .from("offloader_items")
    .select("id")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  const { data, error } =
    parentId === null ? await base.is("parent_id", null) : await base.eq("parent_id", parentId);
  if (error) throw error;
  await Promise.all(
    (data ?? []).map((row, i) =>
      supabase.from("offloader_items").update({ position: i }).eq("id", row.id),
    ),
  );
}

/** Server-computed midpoint position between two (client-named, not
 * client-trusted-for-position) neighbor rows, matching the client's local
 * optimistic-update math. Renormalizes the sibling group and retries once
 * if the resulting gap's decimal expansion has grown unreasonably large. */
async function computeMidpoint(
  supabase: DB,
  userId: string,
  parentId: string | null,
  beforeSiblingId: string | null,
  afterSiblingId: string | null,
): Promise<number> {
  const neighborIds = [beforeSiblingId, afterSiblingId].filter((x): x is string => x !== null);
  const positions = new Map<string, string>();
  if (neighborIds.length) {
    const { data, error } = await supabase
      .from("offloader_items")
      .select("id, position::text")
      .eq("user_id", userId)
      .in("id", neighborIds);
    if (error) throw error;
    for (const row of data ?? [])
      positions.set(row.id as unknown as string, row.position as unknown as string);
  }

  const beforePos = beforeSiblingId ? positions.get(beforeSiblingId) : undefined;
  const afterPos = afterSiblingId ? positions.get(afterSiblingId) : undefined;

  let mid: Decimal;
  if (beforePos !== undefined && afterPos !== undefined) {
    mid = midpointDecimal(beforePos, afterPos);
  } else if (beforePos !== undefined) {
    mid = plusOne(beforePos);
  } else if (afterPos !== undefined) {
    mid = minusOne(afterPos);
  } else {
    mid = { unscaled: 0n, scale: 0 };
  }

  if (mid.scale > MAX_POSITION_DECIMAL_DIGITS) {
    await renormalizeSiblings(supabase, userId, parentId);
    return computeMidpoint(supabase, userId, parentId, beforeSiblingId, afterSiblingId);
  }
  return asPositionValue(mid);
}

/** Defense-in-depth backstop behind client-side drag validation: walks
 * `startId`'s parent chain and reports whether `targetId` appears in it
 * (i.e. whether `startId` is `targetId` itself or one of its descendants). */
async function isSelfOrDescendant(
  supabase: DB,
  userId: string,
  startId: string,
  targetId: string,
): Promise<boolean> {
  let currentId: string | null = startId;
  for (let hops = 0; hops < 10_000 && currentId !== null; hops++) {
    if (currentId === targetId) return true;
    const { data, error } = await supabase
      .from("offloader_items")
      .select("parent_id")
      .eq("user_id", userId)
      .eq("id", currentId)
      .limit(1);
    if (error) throw error;
    currentId = data?.[0]?.parent_id ?? null;
  }
  return false;
}

// ---------------- public server fns ----------------

export const listOffloaderItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("offloader_items")
      .select("*")
      .eq("user_id", userId)
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toItem);
  });

export const createOffloaderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ parentId: NullableIdSchema, content: ContentSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const position = await nextPosition(supabase, userId, data.parentId);
    const { data: row, error } = await supabase
      .from("offloader_items")
      .insert({ user_id: userId, parent_id: data.parentId, content: data.content, position })
      .select("*")
      .single();
    if (error) throw error;
    return toItem(row);
  });

export const updateOffloaderItemContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: IdSchema, content: ContentSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("offloader_items")
      .update({ content: data.content })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const toggleOffloaderItemDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: IdSchema, done: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.done && (await hasUndoneChildren(supabase, userId, data.id))) {
      throw new Error("Blocked: has un-done sub-tasks");
    }
    const { error } = await supabase
      .from("offloader_items")
      .update({ done: data.done })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteOffloaderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: IdSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (await hasUndoneChildren(supabase, userId, data.id)) {
      throw new Error("Blocked: has un-done sub-tasks");
    }
    const { error } = await supabase
      .from("offloader_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const reorderOffloaderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: IdSchema,
        beforeSiblingId: NullableIdSchema,
        afterSiblingId: NullableIdSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: item, error: itemErr } = await supabase
      .from("offloader_items")
      .select("parent_id")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (itemErr) throw itemErr;

    const position = await computeMidpoint(
      supabase,
      userId,
      item.parent_id,
      data.beforeSiblingId,
      data.afterSiblingId,
    );
    const { error } = await supabase
      .from("offloader_items")
      .update({ position })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const reparentOffloaderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: IdSchema,
        newParentId: NullableIdSchema,
        beforeSiblingId: NullableIdSchema,
        afterSiblingId: NullableIdSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.newParentId === data.id) {
      throw new Error("Cannot reparent an item onto itself");
    }
    if (
      data.newParentId !== null &&
      (await isSelfOrDescendant(supabase, userId, data.newParentId, data.id))
    ) {
      throw new Error("Cannot reparent an item under its own descendant");
    }

    const position = await computeMidpoint(
      supabase,
      userId,
      data.newParentId,
      data.beforeSiblingId,
      data.afterSiblingId,
    );
    const { error } = await supabase
      .from("offloader_items")
      .update({ parent_id: data.newParentId, position })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });
