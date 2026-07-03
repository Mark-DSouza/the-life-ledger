// @vitest-environment node
import { describe, it, expect } from "vitest";
import { adminClient, createTestUser, type TestDB } from "../helpers/supabase";
import { loadTemplates, applyTemplate } from "@/lib/fitness-templates";
import { loadFitness } from "@/lib/fitness-data";

type TemplateSeed = {
  goal: "Hypertrophy" | "Cardio";
  name: string;
  description?: string;
  isPublic: boolean;
  ownerUserId?: string;
  days?: {
    weekday: string;
    type: string;
    summary: string;
    exercises?: Record<string, unknown>[];
  }[];
};

/** Insert a template through the given client (admin for public, user client for personal). */
async function insertTemplate(client: TestDB, seed: TemplateSeed): Promise<string> {
  const { data: tpl, error } = await client
    .from("workout_templates")
    .insert({
      goal: seed.goal,
      name: seed.name,
      description: seed.description ?? "",
      is_public: seed.isPublic,
      owner_user_id: seed.ownerUserId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  for (const day of seed.days ?? []) {
    const { data: dayRow, error: dayErr } = await client
      .from("workout_template_days")
      .insert({
        template_id: tpl.id,
        weekday: day.weekday as never,
        type: day.type as never,
        summary: day.summary,
      })
      .select("id")
      .single();
    if (dayErr) throw dayErr;
    if (day.exercises?.length) {
      const { error: exErr } = await client.from("workout_template_exercises").insert(
        day.exercises.map((e, i) => ({
          template_day_id: dayRow.id,
          position: i,
          ...e,
        })) as never,
      );
      if (exErr) throw exErr;
    }
  }
  return tpl.id;
}

describe("loadTemplates", () => {
  it("returns public templates for the goal plus own personal ones, never other users'", async () => {
    const admin = adminClient();
    const alice = await createTestUser();
    const bob = await createTestUser();
    const run = crypto.randomUUID().slice(0, 8);

    await insertTemplate(admin, {
      goal: "Hypertrophy",
      name: `PPL ${run}`,
      isPublic: true,
      days: [{ weekday: "Mon", type: "Hypertrophy", summary: "Push" }],
    });
    await insertTemplate(admin, { goal: "Cardio", name: `Zone2 ${run}`, isPublic: true });
    await insertTemplate(alice.client, {
      goal: "Hypertrophy",
      name: `Alice's plan ${run}`,
      isPublic: false,
      ownerUserId: alice.userId,
    });
    await insertTemplate(bob.client, {
      goal: "Hypertrophy",
      name: `Bob's plan ${run}`,
      isPublic: false,
      ownerUserId: bob.userId,
    });

    const templates = await loadTemplates(alice.client, alice.userId, "Hypertrophy");
    const names = templates.map((t) => t.name);

    expect(names).toContain(`PPL ${run}`);
    expect(names).toContain(`Alice's plan ${run}`);
    expect(names).not.toContain(`Bob's plan ${run}`);
    expect(names).not.toContain(`Zone2 ${run}`); // wrong goal

    const ppl = templates.find((t) => t.name === `PPL ${run}`)!;
    expect(ppl.days).toEqual([{ weekday: "Mon", type: "Hypertrophy", summary: "Push" }]);
  });
});

describe("applyTemplate", () => {
  it("populates the user's Training Week from the template", async () => {
    const admin = adminClient();
    const user = await createTestUser();

    const templateId = await insertTemplate(admin, {
      goal: "Hypertrophy",
      name: `Starter ${crypto.randomUUID().slice(0, 8)}`,
      isPublic: true,
      days: [
        {
          weekday: "Mon",
          type: "Hypertrophy",
          summary: "Chest",
          exercises: [
            {
              exercise_type: "lift",
              name: "Bench Press",
              body_part: "Chest",
              sets: 3,
              reps: 10,
              weight: 60,
              seat: "—",
            },
            { exercise_type: "cardio", name: "Cooldown", pace: 8, duration_min: 10, bpm: 120 },
          ],
        },
        { weekday: "Sun", type: "Rest", summary: "Recovery" },
      ],
    });

    await applyTemplate(user.client, user.userId, templateId);
    const week = await loadFitness(user.client, user.userId);

    expect(week).not.toBeNull();
    expect(week!.Mon.type).toBe("Hypertrophy");
    expect(week!.Mon.bodyParts).toBe("Chest");
    expect(week!.Mon.exercises).toHaveLength(2);
    expect(week!.Mon.exercises[0]).toMatchObject({
      exerciseType: "lift",
      name: "Bench Press",
      sets: 3,
      reps: 10,
      weight: 60,
    });
    expect(week!.Mon.exercises[1]).toMatchObject({ exerciseType: "cardio", pace: 8, bpm: 120 });
    expect(week!.Sun).toMatchObject({ type: "Rest", bodyParts: "Recovery", exercises: [] });
    // days the template does not define land as empty Rest days
    expect(week!.Wed).toMatchObject({ type: "Rest", exercises: [] });
  });

  it("refuses to apply another user's personal template", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    const templateId = await insertTemplate(bob.client, {
      goal: "Hypertrophy",
      name: `Bob private ${crypto.randomUUID().slice(0, 8)}`,
      isPublic: false,
      ownerUserId: bob.userId,
    });

    await expect(applyTemplate(alice.client, alice.userId, templateId)).rejects.toThrow();
    expect(await loadFitness(alice.client, alice.userId)).toBeNull();
  });
});
