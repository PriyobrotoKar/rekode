import type { GetAllTemplatesResponse } from '@rekode/types/client/proto/template';

import { ApiClient } from '@/lib/api-client';

export class TemplateController {
  private static readonly apiClient: ApiClient = new ApiClient('/template');

  static async getAllTemplates(): Promise<GetAllTemplatesResponse> {
    return this.apiClient.get('');
  }
}
