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

  if (res.status === 401 && !path.startsWith('/auth/')) {
    clearToken();
    window.location.assign('/login');
    throw new ApiError(401, 'Unauthorized');
  }

  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    let msg = json?.message ?? res.statusText ?? 'Request failed';
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('timed out')) msg = 'The operation timed out. Please try again.';
    else if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('networkerror')) msg = 'Network error. Please check your connection.';
    else if (lowerMsg.includes('navigation failed') || lowerMsg.includes('browser has disconnected') || lowerMsg.includes('puppeteer')) {
      msg = 'Failed to generate the document. The service might be under heavy load. Please try again in a few moments.';
    }
    
    throw new ApiError(res.status, msg);
  }

  return json as T;
}

export const api = {
  login: (body: { username: string; password: string }) => {
    const credentials = btoa(`${body.username}:${body.password}`);
    return request<{ success: boolean; message?: string; data: { token?: string; expiresIn: number } }>(`/auth/login`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
  },
  googleLogin: (credential: string) =>
    request<{ success: boolean; message?: string; data: { token?: string; expiresIn: number } }>(`/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
};
