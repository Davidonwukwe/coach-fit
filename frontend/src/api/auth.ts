// src/api/auth.ts
import { api } from "./http";

export interface User {
  _id: string;
  name: string;
  email: string;
  // add other fields if your backend returns them
}

export interface AuthResponse {
  token: string; // required, not optional
  user: User;
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

export const fetchMe = (): Promise<User> => {
  return api.get<User>("/auth/me");
};

// alias if you want to use getMe elsewhere
export const getMe = fetchMe;