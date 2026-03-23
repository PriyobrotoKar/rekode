import { getAppSession, removeAppSession, setAppSession } from '@/features/auth/lib/session';

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

  private async refreshTokens() {
    const session = await getAppSession();
    console.log('refreshing tokens', session.refresh_token);

    const cookie = `access_token=${session.access_token}; refresh_token=${session.refresh_token};`;

    const res = await fetch(this.baseUrl + '/auth/refresh-token', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    if (!res.ok) {
      const error = await res.json();
      console.log('error while refreshing tokens', error.message);
      return null;
    }

    return (await res.json()) as { accessToken: string; refreshToken: string };
  }

  async fetch(url?: string, options?: RequestInit) {
    const session = await getAppSession();
    const cookie = `access_token=${session.access_token}; refresh_token=${session.refresh_token};`;

    console.log(cookie);

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

      return await res.json();
    } catch (error) {
      console.error(JSON.stringify(error));
      if (error instanceof ApiError) {
        if (error.code === 404 && options?.method === 'GET') {
          return null;
        }

        if (error.code === 401) {
          const tokens = await this.refreshTokens();
          if (tokens === null) {
            await removeAppSession();
            return null;
          }
          const { accessToken, refreshToken } = tokens;
          await setAppSession({ data: { access_token: accessToken, refresh_token: refreshToken } });
          return this.fetch(url, options);
        }

        throw error;
      }

      throw new ApiError('Something went wrong while fetching data', 500);
    }
  }

  async get(url?: string, options?: RequestInit) {
    return await this.fetch(url, {
      method: 'GET',
      ...options,
    });
  }

  async post(url?: string, data?: unknown, options?: RequestInit) {
    return await this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async patch(url?: string, data?: unknown, options?: RequestInit) {
    return await this.fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(url?: string, data?: Record<string, unknown>, options?: RequestInit) {
    return await this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(url?: string, options?: RequestInit) {
    return await this.fetch(url, {
      method: 'DELETE',
      ...options,
    });
  }
}
