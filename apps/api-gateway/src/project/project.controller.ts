import { type JwtPayload } from '@/auth/types/jwt-payload';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Public } from '@/decorators/public.decorator';
import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { type ClientGrpc, ClientKafka } from '@nestjs/microservices';
import {
  PROJECT_PACKAGE_NAME,
  PROJECT_SERVICE_NAME,
  ProjectServiceClient,
} from '@rekode/types/server/proto/project';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('project')
export class ProjectController {
  private projectService!: ProjectServiceClient;
  constructor(
    @Inject(PROJECT_PACKAGE_NAME) private client: ClientGrpc,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.projectService = this.client.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  @Get()
  getAllProjects(@CurrentUser() user: JwtPayload) {
    return this.projectService.getAllProjects({ userId: user.id });
  }

  @Post()
  createProject(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectService.createProject({ userId: user.id, ...dto });
  }

  @Post(':slug/start')
  startProject(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.projectService.startProject({ slug, userId: user.id });
  }

  @Public()
  @Post(':slug/process')
  processCreated(@Param('slug') slug: string, @Body() body: { port: number }) {
    return this.kafkaClient.emit('process.created', { slug, ...body });
  }

  @Get(':slug')
  getProject(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.projectService.getProject({ slug, userId: user.id });
  }

  //TODO: Implement API key for internal auth
  @Public()
  @Patch(':slug')
  updateProject(@Param('slug') slug: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.editProject({ slug, userId: '', ...dto });
  }
}
