export class OrchestratorService {
  private static readonly BASE_URL = 'http://gateway-service:8080';
  private static readonly CONTAINER_NAME = process.env.CONTAINER_NAME;

  private static async fetch(url: string, options?: RequestInit) {
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

  private async watchProcesses() {}

  static async createProcess(port: number) {
    return this.fetch('/process', {
      method: 'POST',
      body: JSON.stringify({ port, name: this.CONTAINER_NAME }),
    });
  }

  static async stopProcess() {
    return this.fetch(`/process/${this.CONTAINER_NAME}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  }
}
