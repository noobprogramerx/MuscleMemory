// src/types/index.ts
/**
 * Types for the Muscle Training Record App
 * @module Types
 */

/** Enum for body parts (muscle groups) */
export enum BodyPart {
  CHEST = "CHEST",
  SHOULDER = "SHOULDER",
  BYCEPS = "BYCEPS",
  BACK = "BACK",
  TRICEPS = "TRICEPS",
}

/** Unique identifier for an exercise (stable even if name changes) */
export type ExerciseId = string;

/** Exercise definition */
export interface Exercise {
  /** Stable id */
  id: ExerciseId;
  /** Display name (can be edited) */
  name: string;
  /** Body part this exercise belongs to */
  part: BodyPart;
}

/** Record for a single set */
export interface SetRecord {
  /** Weight in kg */
  weight: number;
  /** Repetitions */
  reps: number;
}

/** Record for a day (one exercise) */
export interface DayRecord {
  /** Exercise id */
  exerciseId: ExerciseId;
  /** Date string (ISO) */
  date: string;
  /** Array of sets */
  sets: SetRecord[];
}

/** Complete storage structure */
export interface StoreState {
  /** All defined exercises */
  exercises: Exercise[];
  /** All day records */
  records: DayRecord[];
}
