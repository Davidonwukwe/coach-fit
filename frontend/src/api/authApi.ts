// src/api/authApi.ts
import apiClient from "./httpClient";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const login = async (email: string, password: string) => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
};

export const register = async (
  name: string,
  email: string,
  password: string
) => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return data;
};
