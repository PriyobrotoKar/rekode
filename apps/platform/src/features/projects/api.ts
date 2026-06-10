import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectRequest,
  GetProjectResponse,
} from '@rekode/types/client/proto/project';

import { ApiClient } from '@/lib/api-client';

export class ProjectController {
  private static readonly apiClient: ApiClient = new ApiClient('/project');

  static async createProject(
    request: Omit<CreateProjectRequest, 'userId'>,
  ): Promise<CreateProjectResponse> {
    return this.apiClient.post('', request);
  }

  static async getProjectBySlug(slug: GetProjectRequest['slug']): Promise<GetProjectResponse> {
    return this.apiClient.get(`/${slug}`);
  }
}
