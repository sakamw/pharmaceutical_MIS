/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeBaseUrl(input?: string): string {
  let raw = (input || "").split(/[\s,]+/).filter(Boolean)[0] || "";
  // Fix common typos like http// or https//
  raw = raw.replace(/^http\/\/(?!\/)/, "http://").replace(/^https\/\/(?!\/)/, "https://");
  // Remove trailing slashes
  raw = raw.replace(/\/+$/, "");
  return raw;
}

const API_BASE_URL = (() => {
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin)
    return window.location.origin;
  return "http://localhost:8000";
})();

// Token storage helpers
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string | null) {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string };
    if (data?.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      return data.access;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  let access = getAccessToken();
  let res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Try refresh once
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      access = newAccess;
      res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newAccess}`,
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const message = await safeErrorMessage(res);
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}

async function safeErrorMessage(res: Response) {
  try {
    const data = await res.json();
    // Common DRF patterns:
    // { detail: "..." } or { field: ["error1", "error2"], field2: ["..."] }
    if (typeof data === "string") return data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data && typeof data === "object") {
      const parts: string[] = [];
      for (const [key, value] of Object.entries<any>(data)) {
        if (Array.isArray(value)) {
          parts.push(`${key}: ${value.join(", ")}`);
        } else if (typeof value === "string") {
          parts.push(`${key}: ${value}`);
        } else if (value && typeof value === "object") {
          // Nested error objects
          parts.push(`${key}: ${JSON.stringify(value)}`);
        }
      }
      if (parts.length) return parts.join(" | ");
    }
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

// Convenience helpers
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

export { API_BASE_URL };
