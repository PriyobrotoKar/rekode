import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
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

  constructor(
    @Inject(CONTAINER_PROVIDER) private readonly containerProvider: IContainerProvider,
    @Inject(TEMPLATE_PACKAGE_NAME) private readonly templateClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.templateService =
      this.templateClient.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  async provisionContainer(input: ProjectCreatedDto) {
    this.logger.log(`Provisioning container for project ${input.projectSlug}`);

    const {} = await lastValueFrom(this.templateService.getAllTemplates({}));

    // const template = templates.find((template) => template.id === input.templateId);

    await this.containerProvider.createContainer({
      ...input,
      templateFolderPath: '/tmp/folder_path',
    });
  }
}
