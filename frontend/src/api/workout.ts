// src/api/workout.ts
import { api } from "./http";

export interface WorkoutSet {
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface WorkoutItem {
  exerciseId: string | any; // can be string or populated object from backend
  exerciseName?: string;
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

// Update an existing workout (full edit)
export const updateWorkout = async (
  id: string,
  payload: Omit<Workout, "_id" | "userId" | "createdAt" | "updatedAt">
): Promise<Workout> => {
  return api.put<Workout>(`/workouts/${id}`, payload);
};

// Delete a workout
export const deleteWorkout = async (
  id: string
): Promise<{ message: string }> => {
  return api.delete<{ message: string }>(`/workouts/${id}`);
};