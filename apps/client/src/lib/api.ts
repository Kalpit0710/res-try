import { clearToken, getToken } from './auth';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.assign('/login');
    throw new ApiError(401, 'Unauthorized');
  }

  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    throw new ApiError(res.status, json?.message ?? 'Request failed');
  }

  return json as T;
}

export const api = {
  login: (body: { username: string; password: string }) =>
    request<{ success: boolean; data: { token: string; expiresIn: number } }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
