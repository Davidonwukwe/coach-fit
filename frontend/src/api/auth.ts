// src/api/auth.ts
import { api } from "./http";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = (
  email: string,
  password: string
): Promise<AuthResponse> => {
  return api.post<AuthResponse>("/auth/login", { email, password });
};

export const register = (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  return api.post<AuthResponse>("/auth/register", { name, email, password });
};

export const getMe = (): Promise<User> => {
  return api.get<User>("/auth/me");
};