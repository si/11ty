/**
 * The Worker's copy of "which habits exist and what their schema is" - the
 * same schema-config JSON files that drive the static Eleventy shell
 * (`_data/habits/*.json`), imported directly so there's exactly one source
 * of truth for each habit's metric definitions. Wrangler's bundler (esbuild)
 * resolves JSON imports at build time, so these become part of the deployed
 * Worker - no filesystem access needed at request time (Workers can't read
 * arbitrary files off disk anyway).
 *
 * Adding a habit (e.g. MapTap): add its `_data/habits/<slug>.json` schema
 * config as usual, then add one import + array entry here. Nothing else in
 * this file changes.
 */

import duolingo from "../../_data/habits/duolingo.json";
import solitaire from "../../_data/habits/solitaire.json";
import sudoku from "../../_data/habits/sudoku.json";

export const HABIT_CONFIGS = [duolingo, solitaire, sudoku];

export function getHabitConfig(slug) {
  return HABIT_CONFIGS.find((h) => h.id === slug) || null;
}
