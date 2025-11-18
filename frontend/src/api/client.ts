// frontend/src/api/client.ts
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      errorText || `Request failed with status ${res.status} (${res.statusText})`
    );
  }

  // If no content (204), just return as any
  if (res.status === 204) return {} as T;

  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body?: any, token?: string | null) =>
    request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body?: any, token?: string | null) =>
    request<T>(path, { method: "PUT", body, token }),
  patch: <T>(path: string, body?: any, token?: string | null) =>
    request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};
