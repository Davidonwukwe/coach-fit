// src/api/httpClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token if you later store it in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("coachfit_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
