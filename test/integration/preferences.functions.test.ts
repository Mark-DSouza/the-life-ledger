// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createTestUser } from "../helpers/supabase";
import { getUserPreferences, saveUserPreferences } from "@/lib/preferences-data";

describe("user preferences", () => {
  it("defaults to kg when the user has no preferences row", async () => {
    const { userId, client } = await createTestUser();
    expect(await getUserPreferences(client, userId)).toEqual({ weightUnit: "kg" });
  });

  it("persists the chosen unit", async () => {
    const { userId, client } = await createTestUser();
    await saveUserPreferences(client, userId, { weightUnit: "lbs" });
    expect(await getUserPreferences(client, userId)).toEqual({ weightUnit: "lbs" });
  });

  it("updates the existing row on repeated saves", async () => {
    const { userId, client } = await createTestUser();
    await saveUserPreferences(client, userId, { weightUnit: "lbs" });
    await saveUserPreferences(client, userId, { weightUnit: "kg" });
    expect(await getUserPreferences(client, userId)).toEqual({ weightUnit: "kg" });
  });
});
