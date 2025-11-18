// frontend/src/api/auth.ts
import { http } from "./http";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  return http<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  return http<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
};

export const getMe = async (): Promise<User> => {
  // token is taken from localStorage inside http()
  return http<User>("/auth/me", {
    method: "GET",
  });
};
