import { getAppSession, removeAppSession } from '@/features/auth/lib/session';

import { refreshTokens } from './auth';

export class ApiError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export class ApiClient {
  baseUrl: string = 'http://localhost:8000';
  headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(private readonly resourceUrl: string) {}

  async fetch<T = unknown>(url?: string, options?: RequestInit): Promise<T> {
    const session = await getAppSession();
    if (!session) {
      throw new ApiError('Session not found', 401);
    }

    const cookie = `access_token=${session.access_token}; refresh_token=${session.refresh_token};`;

    try {
      const res = await fetch(this.baseUrl + this.resourceUrl + url, {
        credentials: 'include',
        headers: { ...this.headers, ...options?.headers, Cookie: cookie },
        ...options,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new ApiError(error.message, res.status);
      }

      return (await res.json()) as T;
    } catch (error) {
      console.error(JSON.stringify(error));
      if (error instanceof ApiError) {
        if (error.code === 404 && options?.method === 'GET') {
          return null as T;
        }

        if (error.code === 401) {
          const tokens = await refreshTokens();
          if (tokens === null) {
            await removeAppSession();
            return null as T;
          }
          const updatedCookies = tokens;

          const headers = {
            ...options?.headers,
            ...('Cookie' in updatedCookies && {
              Cookie: updatedCookies.Cookie,
            }),
          };

          return this.fetch(url, { ...options, headers });
        }

        throw error;
      }

      throw new ApiError('Something went wrong while fetching data', 500);
    }
  }

  async get<T = unknown>(url?: string, options?: RequestInit): Promise<T> {
    return await this.fetch(url, {
      method: 'GET',
      ...options,
    });
  }

  async post<T = unknown>(url?: string, data?: unknown, options?: RequestInit): Promise<T> {
    return await this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async patch<T = unknown>(url?: string, data?: unknown, options?: RequestInit): Promise<T> {
    return await this.fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put<T = unknown>(
    url?: string,
    data?: Record<string, unknown>,
    options?: RequestInit,
  ): Promise<T> {
    return await this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete<T = unknown>(url?: string, options?: RequestInit): Promise<T> {
    return await this.fetch(url, {
      method: 'DELETE',
      ...options,
    });
  }
}
