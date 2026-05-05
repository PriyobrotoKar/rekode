import { type JwtPayload } from '@/auth/types/jwt-payload';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import {
  PROJECT_PACKAGE_NAME,
  PROJECT_SERVICE_NAME,
  ProjectServiceClient,
} from '@rekode/types/server/proto/project';

import { CreateProjectDto } from './dto/create-project.dto';

@Controller('project')
export class ProjectController {
  private projectService!: ProjectServiceClient;
  constructor(@Inject(PROJECT_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.projectService = this.client.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  @Post()
  createProject(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectService.createProject({ userId: user.id, ...dto });
  }

  @Get(':slug')
  getProject(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.projectService.getProject({ slug, userId: user.id });
  }
}
