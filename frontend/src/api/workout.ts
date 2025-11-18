// src/api/workout.ts
import { api } from "./http";

export interface Workout {
  _id: string;
  date: string;
  notes?: string;
  // you can add exercises, sets, reps, etc later
}

export interface CreateWorkoutPayload {
  date: string;
  notes?: string;
  // add exercises array later
}

export const fetchWorkouts = async (): Promise<Workout[]> => {
  return api.get<Workout[]>("/workouts");
};

export const createWorkout = async (
  payload: CreateWorkoutPayload
): Promise<Workout> => {
  return api.post<Workout>("/workouts", payload);
};