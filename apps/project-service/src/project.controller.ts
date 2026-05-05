import { Controller } from '@nestjs/common';
import {
  CreateProjectRequest,
  CreateProjectResponse,
  EditProjectRequest,
  EditProjectResponse,
  GetProjectRequest,
  GetProjectResponse,
  ProjectServiceController,
  ProjectServiceControllerMethods,
} from '@rekode/types/server/proto/project';
import { Observable } from 'rxjs';

import { ProjectService } from './project.service';

@Controller()
@ProjectServiceControllerMethods()
export class ProjectController implements ProjectServiceController {
  constructor(private readonly projectService: ProjectService) {}

  createProject(
    request: CreateProjectRequest,
  ): Promise<CreateProjectResponse> | Observable<CreateProjectResponse> | CreateProjectResponse {
    return this.projectService.createProject(request);
  }

  getProject(
    request: GetProjectRequest,
  ): Promise<GetProjectResponse> | Observable<GetProjectResponse> | GetProjectResponse {
    return this.projectService.getProject(request);
  }

  editProject(
    request: EditProjectRequest,
  ): Promise<EditProjectResponse> | Observable<EditProjectResponse> | EditProjectResponse {
    return this.projectService.editProject(request);
  }
}
