# Unified exercises table for lifts and cardio

Lift exercises and cardio blocks are stored in a single `fitness_exercises` table (and `workout_template_exercises` for templates) with an `exercise_type` discriminator column (`lift | cardio`), rather than in separate `fitness_lifts` / `fitness_cardio` tables.

The original schema used two separate tables. We collapsed them because templates need to define both lifts and cardio in a consistent structure, the two types share enough fields (name, position, day association) that a single table reduces join complexity at read time, and advanced users may want to mix or extend fields freely. Fields that don't apply to a given Exercise Type are nullable and left null — a lift row carries null pace/duration/bpm, a cardio row carries null body_part/sets/reps/weight.

## Considered options

- **Two tables** (`fitness_lifts` + `fitness_cardio`): rejected because it requires the app to join two result sets every time a day is loaded, and template application would need to fan out to two tables per day.
- **JSONB per day**: rejected in favour of normalized tables for queryability and consistency with the rest of the schema.
