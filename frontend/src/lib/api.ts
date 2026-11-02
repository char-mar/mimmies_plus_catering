import toast from "react-hot-toast";

import { useAuthStore } from "@/features/auth/store";
import type { AuthSessionData } from "@/features/auth/types";

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(
  /\/+$/,
  "",
);

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiEnvelope<T> {
  success: true;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  auth?: boolean;
  headers?: HeadersInit;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (!query) {
    return base;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return "The request could not be completed.";
    case 401:
      return "Authentication is required.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "That request conflicts with existing data.";
    case 413:
      return "The file is too large.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    case 502:
    case 503:
      return "The service is temporarily unavailable. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function errorMessageFrom(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.message === "string") {
    const message = payload.message.trim();
    if (message) {
      return message;
    }
  }

  return fallbackMessage(status);
}

let refreshPromise: Promise<AuthSessionData | null> | null = null;
let lastUnauthorizedToastAt = 0;

async function performRefresh(): Promise<AuthSessionData | null> {
  try {
    // This is the only request that must bypass apiRequest: it is the call
    // that mints a new access token, and its credentials live in an httpOnly
    // cookie scoped to /api/v1/auth.
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await parseBody(response);

    if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) {
      return null;
    }

    const data = payload.data;

    if (typeof data.accessToken !== "string" || !isRecord(data.user)) {
      return null;
    }

    const session = data as unknown as AuthSessionData;

    useAuthStore.getState().setSession(session);

    return session;
  } catch {
    return null;
  }
}

export function refreshSession(): Promise<AuthSessionData | null> {
  // Single-flight: concurrent 401s and the boot-time refresh must not rotate
  // the same refresh token twice (the backend revokes the whole family on reuse).
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function handleUnauthorized(): void {
  const store = useAuthStore.getState();
  const wasAuthenticated = store.status === "authenticated";

  if (wasAuthenticated) {
    store.clearSession();
  }

  if (wasAuthenticated && Date.now() - lastUnauthorizedToastAt > 3000) {
    lastUnauthorizedToastAt = Date.now();
    toast.error("Your session has expired. Please sign in again.");
  }
}

async function executeRequest(
  url: string,
  options: RequestOptions,
  auth: boolean,
): Promise<Response> {
  const token = auth ? useAuthStore.getState().accessToken : null;
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      signal: options.signal,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const auth = options.auth ?? true;
  const url = buildUrl(path, options.query);

  let response = await executeRequest(url, options, auth);

  if (response.status === 401 && auth) {
    const session = await refreshSession();

    if (!session) {
      handleUnauthorized();
      throw new ApiError(
        "Your session has expired. Please sign in again.",
        401,
      );
    }

    response = await executeRequest(url, options, auth);
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      handleUnauthorized();
    }

    throw new ApiError(errorMessageFrom(payload, response.status), response.status, payload);
  }

  if (payload === null) {
    return { success: true, data: undefined as T };
  }

  return payload as ApiEnvelope<T>;
}
