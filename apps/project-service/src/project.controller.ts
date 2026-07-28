import { Controller } from '@nestjs/common';
import {
  CreateProjectRequest,
  CreateProjectResponse,
  EditProjectRequest,
  EditProjectResponse,
  GetAllProjectsRequest,
  GetAllProjectsResponse,
  GetProjectRequest,
  GetProjectResponse,
  ProjectServiceController,
  ProjectServiceControllerMethods,
  StartProjectRequest,
  StartProjectResponse,
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

  getAllProjects(
    request: GetAllProjectsRequest,
  ): Promise<GetAllProjectsResponse> | Observable<GetAllProjectsResponse> | GetAllProjectsResponse {
    return this.projectService.getAllProjects(request);
  }

  startProject(
    request: StartProjectRequest,
  ): Promise<StartProjectResponse> | Observable<StartProjectResponse> | StartProjectResponse {
    return this.projectService.startProject(request);
  }

  editProject(
    request: EditProjectRequest,
  ): Promise<EditProjectResponse> | Observable<EditProjectResponse> | EditProjectResponse {
    return this.projectService.editProject(request);
  }
}
