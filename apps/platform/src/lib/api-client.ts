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

  async fetch(url?: string, options?: RequestInit) {
    try {
      const res = await fetch(this.baseUrl + this.resourceUrl + url, {
        ...options,
        headers: { ...this.headers, ...options?.headers },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new ApiError(error.message, res.status);
      }

      return await res.json();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 404 && options?.method === 'GET') {
          return null;
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

  async patch(url?: string, data?: Record<string, unknown>, options?: RequestInit) {
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
