import { status } from '@grpc/grpc-js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ClientGrpc, RpcException } from '@nestjs/microservices';
import {
  PROJECT_PACKAGE_NAME,
  PROJECT_SERVICE_NAME,
  ProjectServiceClient,
  ProjectStatus,
} from '@rekode/types/server/proto/project';
import {
  TEMPLATE_PACKAGE_NAME,
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
} from '@rekode/types/server/proto/template';
import { lastValueFrom } from 'rxjs';

import { ProjectCreatedDto } from './dto/project-created.dto';
import { CONTAINER_PROVIDER, type IContainerProvider } from './interfaces/container-provider';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private templateService: TemplateServiceClient;
  private projectService: ProjectServiceClient;

  constructor(
    @Inject(CONTAINER_PROVIDER) private readonly containerProvider: IContainerProvider,
    @Inject(TEMPLATE_PACKAGE_NAME) private readonly templateClient: ClientGrpc,
    @Inject(PROJECT_PACKAGE_NAME) private readonly projectClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.templateService =
      this.templateClient.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
    this.projectService = this.projectClient.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  async provisionContainer(input: ProjectCreatedDto) {
    this.logger.log(`Provisioning container for project ${input.projectSlug}`);

    const { project } = await lastValueFrom(
      this.projectService.getProject({
        slug: input.projectSlug,
        userId: input.userId,
      }),
    );

    if (!project) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const { templates } = await lastValueFrom(this.templateService.getAllTemplates({}));

    const template = templates.find((template) => template.id === project.templateId);

    if (!template) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Template not found',
      });
    }

    const res = await this.containerProvider.createContainer({
      templateRepoUrl: template.repoUrl,
      installCmd: template.installCmd,
      buildCmd: template.buildCmd,
      startCmd: template.startCmd,
      fileSystemPath: project.fileSystemPath,
      projectSlug: project.slug,
    });

    await lastValueFrom(
      this.projectService.editProject({
        slug: input.projectSlug,
        userId: input.userId,
        status: ProjectStatus.PROJECT_STATUS_RUNNING,
        containerUrl: res.containerUrl,
      }),
    );
  }
}
