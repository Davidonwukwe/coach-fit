// src/api/exercise.ts
import { api } from "./http";

export interface Exercise {
  _id: string;
  name: string;
  muscleGroup?: string;
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  return api.get<Exercise[]>("/exercises");
};

export const createExercise = async (name: string): Promise<Exercise> => {
  return api.post<Exercise>("/exercises", { name });
};