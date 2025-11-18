// frontend/src/api/auth.ts
import { apiClient } from "./client";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", { email, password });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
}

export async function fetchMe(token: string): Promise<User> {
  return apiClient.get<User>("/auth/me", token);
}
