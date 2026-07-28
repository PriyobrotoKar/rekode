import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetAllProjectsResponse,
  GetProjectRequest,
  GetProjectResponse,
  StartProjectResponse,
} from '@rekode/types/client/proto/project';

import { ApiClient } from '@/lib/api-client';

export class ProjectController {
  private static readonly apiClient: ApiClient = new ApiClient('/project');

  static async createProject(
    request: Omit<CreateProjectRequest, 'userId'>,
  ): Promise<CreateProjectResponse> {
    return this.apiClient.post('', request);
  }

  static async getAllProjects(): Promise<GetAllProjectsResponse> {
    return this.apiClient.get('');
  }

  static async startProject(slug: string): Promise<StartProjectResponse> {
    return this.apiClient.post(`/${slug}/start`, {});
  }

  static async getProjectBySlug(slug: GetProjectRequest['slug']): Promise<GetProjectResponse> {
    return this.apiClient.get(`/${slug}`);
  }
}
