import { Injectable, Logger } from '@nestjs/common';
import {
  Environment,
  GetAllTemplatesRequest,
  GetAllTemplatesResponse,
  Template as ProtoTemplate,
} from '@rekode/types/server/proto/template';

import { Template as PrismaTemplate } from './generated/prisma/client';
import { TemplateEnvironment } from './generated/prisma/enums';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly protoEnvironmentMap: Record<TemplateEnvironment, Environment> = {
    [TemplateEnvironment.BROWSER]: Environment.ENVIRONMENT_BROWSER,
    [TemplateEnvironment.SERVER]: Environment.ENVIRONMENT_SERVER,
  };
  private readonly prismaEnvironmentMap: Record<Environment, TemplateEnvironment | undefined> = {
    [Environment.ENVIRONMENT_UNSPECIFIED]: undefined,
    [Environment.UNRECOGNIZED]: undefined,
    [Environment.ENVIRONMENT_BROWSER]: TemplateEnvironment.BROWSER,
    [Environment.ENVIRONMENT_SERVER]: TemplateEnvironment.SERVER,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getAllTemplates({
    environment,
    language,
  }: GetAllTemplatesRequest): Promise<GetAllTemplatesResponse> {
    this.logger.log('Requested to get all templates');

    const templates = await this.prisma.template.findMany({
      where: {
        environment: environment ? this.prismaEnvironmentMap[environment] : undefined,
        language: language ?? undefined,
      },
    });

    this.logger.log(`Found ${templates.length} templates`);

    return {
      templates: templates.map((template): ProtoTemplate => this.toProtoTemplate(template)),
    };
  }

  private toProtoTemplate(template: PrismaTemplate): ProtoTemplate {
    return {
      id: template.id,
      slug: template.slug,
      technologies: template.technologies,
      language: template.language,
      environment:
        this.protoEnvironmentMap[template.environment] ?? Environment.ENVIRONMENT_UNSPECIFIED,
      description: template.description,
      repoUrl: template.repoUrl,
    };
  }
}
