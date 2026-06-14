# Archived muscle diagram code

This folder holds muscle diagram work removed from the active app so you can try another approach.

## Contents

- `components/MuscleDiagram/` — Interactive muscle diagram (hover, tooltip, legend, chips, Back Squat demo)
- `components/workout/` — Older workout anatomy map (`ExerciseAnatomyMap`, `MuscleBodyDiagram`, path data)
- `assets/anatomy/` — Placeholder SVG asset templates for professional artwork import

## Restore the interactive diagram

1. Move `components/MuscleDiagram` back to `src/components/MuscleDiagram`
2. Move `assets/anatomy` back to `src/assets/anatomy`
3. In `ExerciseInfoButton.tsx`, import and render `MuscleDiagram` again (see git history)

## Restore the legacy workout diagram

1. Move files from `_archive/components/workout/` back to `src/components/workout/`
2. Wire `ExerciseAnatomyMap` or `MuscleBodyDiagram` where needed

## Note

`_archive` is not imported by the app build. TypeScript may still typecheck these files if they remain under `src/`. To exclude from `tsc`, add `src/_archive` to `exclude` in `tsconfig.app.json`.
