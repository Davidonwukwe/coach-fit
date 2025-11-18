// src/api/workoutApi.ts
import apiClient from "./httpClient";

export interface WorkoutSet {
  reps: number;
  weight: number;
  rpe?: number;
}

export interface WorkoutItem {
  exerciseId: string;
  exerciseName?: string; // optional for display
  sets: WorkoutSet[];
}

export interface WorkoutPayload {
  date: string; // ISO string
  notes?: string;
  items: WorkoutItem[];
}

export const createWorkout = async (payload: WorkoutPayload) => {
  const { data } = await apiClient.post("/workouts", payload);
  return data;
};

export const getWorkouts = async () => {
  const { data } = await apiClient.get("/workouts");
  return data;
};

export const getWeeklyAnalytics = async () => {
  const { data } = await apiClient.get("/analytics/weekly");
  return data;
};

export const getTrendAnalytics = async () => {
  const { data } = await apiClient.get("/analytics/trends");
  return data;
};

export const runRecommendations = async () => {
  const { data } = await apiClient.post("/recommendations/run");
  return data;
};
