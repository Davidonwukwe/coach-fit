// src/api/workout.ts
import { api } from "./http";

export interface WorkoutSet {
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface WorkoutItem {
  exerciseId: string;
  exerciseName?: string; // optional, if you populate it on the backend
  sets: WorkoutSet[];
}

export interface Workout {
  _id: string;
  userId: string;
  date: string; // ISO string
  notes?: string;
  items: WorkoutItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Fetch all workouts for logged-in user
export const fetchWorkouts = async (): Promise<Workout[]> => {
  return api.get<Workout[]>("/workouts");
};

// Create a new workout
export const createWorkout = async (
  payload: Omit<Workout, "_id" | "userId" | "createdAt" | "updatedAt">
): Promise<Workout> => {
  return api.post<Workout>("/workouts", payload);
};

export async function fetchWorkoutById(id: string): Promise<Workout> {
  const res = await fetch(`/api/workouts/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch workout");
  return res.json();
}
