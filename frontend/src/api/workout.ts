// src/api/workout.ts
import { api } from "./http";

export interface WorkoutSet {
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface WorkoutItem {
  exerciseId: string | { _id: string; name: string; muscleGroup: string }; // runtime can be populated object
  exerciseName?: string; // optional, if you populate it on the backend or set on frontend
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

// Fetch a single workout by id (if you ever want to use it)
export const fetchWorkoutById = async (id: string): Promise<Workout> => {
  return api.get<Workout>(`/workouts/${id}`);
};

// Create a new workout
export const createWorkout = async (
  payload: Omit<Workout, "_id" | "userId" | "createdAt" | "updatedAt">
): Promise<Workout> => {
  return api.post<Workout>("/workouts", payload);
};

// Update workout (we’ll use this mainly for notes right now)
export const updateWorkout = async (
  id: string,
  payload: Partial<Omit<Workout, "_id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Workout> => {
  return api.put<Workout>(`/workouts/${id}`, payload);
};

// Delete workout (if you’re using it)
export const deleteWorkout = async (id: string): Promise<{ message: string }> => {
  return api.delete<{ message: string }>(`/workouts/${id}`);
};