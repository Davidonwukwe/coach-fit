// frontend/src/api/workout.ts
import { http } from "./http";

export interface Workout {
  _id: string;
  date: string;
  // adjust these fields based on your backend Model
  name: string;
  notes?: string;
}

export interface CreateWorkoutPayload {
  date: string;
  name: string;
  notes?: string;
}

export const fetchWorkouts = async (): Promise<Workout[]> => {
  return http<Workout[]>("/workouts", {
    method: "GET",
  });
};

export const createWorkout = async (
  payload: CreateWorkoutPayload
): Promise<Workout> => {
  return http<Workout>("/workouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
