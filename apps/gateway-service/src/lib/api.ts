export class ApiGatewayService {
  private static readonly BASE_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:8000';

  static async fetch(url: string, options?: RequestInit) {
    const reqUrl = this.BASE_URL + url;
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(reqUrl, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch: ${error}`);
    }
  }
}
