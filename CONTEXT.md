# LifeOS Fitness

The fitness section of LifeOS is a personal weekly workout tracker. Users set up a plan once via an onboarding wizard and then track exercises, sets, reps, and weight day-by-day.

## Language

### Onboarding & Setup

**Workout Goal**:
The user's overall training objective, chosen during onboarding. One of `Hypertrophy | Cardio | Custom`. Determines which Public Templates are offered.
_Avoid_: Training type, fitness goal, plan type

**Onboarding Flow**:
The two-step full-page wizard shown the first time a user visits `/fitness` (i.e. when they have no Training Week data). Step 1: pick a Workout Goal. Step 2: pick a Template. Skipped on subsequent visits.
_Avoid_: Setup wizard, first-run experience

**Change Plan**:
The action of replacing the active Training Week with a new Template, triggered by a "Change plan" button in the page header. Always auto-snapshots the current Training Week as a Personal Template before overwriting.
_Avoid_: Reset plan, switch plan

### Templates

**Workout Plan Template** (or just **Template**):
A fully-specified weekly training schedule: 7 days each with a workout type, body-part summary, lift exercises (sets/reps/weight), and cardio blocks. Can be Public or Personal.
_Avoid_: Workout plan, program, preset

**Public Template**:
A Template inserted by an administrator (via SQL/Supabase dashboard), visible to all users in the Onboarding Flow and Change Plan picker. Users cannot create or edit Public Templates.
_Avoid_: Default template, system template, curated template

**Personal Template**:
A Template owned by a specific user. Created either by "Save as template" from the fitness page, or automatically during a Change Plan action. Only visible to its owner.
_Avoid_: Custom template, saved plan, user template

### Weekly Tracking

**Training Week**:
The user's active 7-day workout schedule (Mon–Sun), stored in `fitness_days` and `fitness_exercises`. Populated from a Template during onboarding or editable directly at any time.
_Avoid_: Weekly plan, active plan, current schedule

**Day Type**:
The workout category assigned to a single day within a Training Week or Template. One of `Strength | Hypertrophy | Cardio | Rest`. A Training Week goal of "Hypertrophy" can still include days with Day Type "Cardio" or "Rest".
_Avoid_: Workout type (overloaded — use Day Type for the day-level label)

**Exercise**:
A single training activity within a day — either a lift or a cardio block. Stored in `fitness_exercises` (or `workout_template_exercises` for templates). Discriminated by Exercise Type.
_Avoid_: Lift Exercise, Cardio Block (both collapsed into Exercise)

**Exercise Type**:
The discriminator on every Exercise row. Either `lift` (resistance training: body part, sets, reps, weight) or `cardio` (aerobic: pace, duration, BPM). Fields not relevant to a given type are null.
_Avoid_: Workout type (overloaded), exercise category

**Weight Unit**:
A global user preference — `kg` or `lbs` — applied to the weight field on all lift Exercises. Stored once in `user_preferences`, not per exercise row.
_Avoid_: Unit preference, measurement system

### Import / Export

**Fitness CSV**:
A single flat file representing one Training Week. One row per Exercise, with sparse columns where not applicable (e.g. cardio rows leave sets/reps/weight blank, lift rows leave pace/duration/bpm blank). Importing a Fitness CSV performs a full replace of the active Training Week after confirmation.
_Avoid_: Workout export, exercise CSV

## Flagged ambiguities

**"Workout type"** is overloaded in the existing codebase — the DB enum `workout_type` refers to what this glossary calls **Day Type**. The word "type" also appears in the context of Workout Goal (user-level) and template categorisation. Prefer **Day Type** for day-level labels and **Workout Goal** for the user-level training objective.

## Example dialogue

> **Dev:** When a user picks "Hypertrophy" in the Onboarding Flow, are all their days set to Hypertrophy?
>
> **Domain expert:** No — "Hypertrophy" is the Workout Goal, which just filters which Templates we show them. Each Template has its own Day Types per day. A Hypertrophy template might have Monday as Hypertrophy, Wednesday as Strength, and Sunday as Rest.
>
> **Dev:** Got it. And if they later hit "Change Plan" — what happens to what they've already customised?
>
> **Domain expert:** Before we overwrite their Training Week, we auto-save it as a Personal Template so nothing is lost. Then we apply the new Template's data.
>
> **Dev:** Can they share their Personal Templates with other users?
>
> **Domain expert:** No — Personal Templates are private. Only admins can add Public Templates.
