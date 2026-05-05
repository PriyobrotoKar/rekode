import { status } from '@grpc/grpc-js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import {
  projectStatusFromJSON,
  projectVisibilityFromJSON,
} from '@rekode/types/client/proto/project';
import {
  CreateProjectRequest,
  EditProjectRequest,
  GetProjectRequest,
  ProjectStatus,
  ProjectVisibility,
  Project as ProtoProject,
} from '@rekode/types/server/proto/project';

import { Project } from './generated/prisma/client';
import { ProjectVisibility as PrismaProjectVisibility } from './generated/prisma/enums';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  private readonly projectVisibilityMap: Record<
    ProjectVisibility,
    PrismaProjectVisibility | undefined
  > = {
    [ProjectVisibility.UNRECOGNIZED]: undefined,
    [ProjectVisibility.PROJECT_VISIBILITY_UNSPECIFIED]: PrismaProjectVisibility.PUBLIC,
    [ProjectVisibility.PROJECT_VISIBILITY_PUBLIC]: PrismaProjectVisibility.PUBLIC,
    [ProjectVisibility.PROJECT_VISIBILITY_PRIVATE]: PrismaProjectVisibility.PRIVATE,
  };

  // private readonly projectStatusMap: Record<ProjectStatus, PrismaProjectStatus | undefined> = {
  //   [ProjectStatus.UNRECOGNIZED]: undefined,
  //   [ProjectStatus.PROJECT_STATUS_UNSPECIFIED]: PrismaProjectStatus.READY,
  //   [ProjectStatus.PROJECT_STATUS_BOOTING]: PrismaProjectStatus.BOOTING,
  //   [ProjectStatus.PROJECT_STATUS_LOADING_FILES]: PrismaProjectStatus.LOADING_FILES,
  //   [ProjectStatus.PROJECT_STATUS_INSTALLING_DEPENDENCIES]:
  //     PrismaProjectStatus.INSTALLING_DEPENDENCIES,
  //   [ProjectStatus.PROJECT_STATUS_READY]: PrismaProjectStatus.READY,
  //   [ProjectStatus.PROJECT_STATUS_ERROR]: PrismaProjectStatus.ERROR,
  //   [ProjectStatus.PROJECT_STATUS_STOPPED]: PrismaProjectStatus.STOPPED,
  // };

  constructor(
    private readonly prisma: PrismaService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async createProject({ slug, description, visibility, templateId, userId }: CreateProjectRequest) {
    this.logger.log(`User: ${userId} requested to create project: ${slug}`);

    const projectAlreadyExists = await this.prisma.project.findUnique({
      where: {
        slug,
      },
    });

    if (projectAlreadyExists) {
      this.logger.error(`Project already exists with slug ${slug}`);
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Project already exists. Use a different slug.`,
      });
    }

    const project = await this.prisma.project.create({
      data: {
        slug,
        description,
        visibility: this.projectVisibilityMap[visibility] ?? PrismaProjectVisibility.PUBLIC,
        templateId,
        userId,
        fileSystemPath: `project/${slug}`,
      },
    });

    this.kafkaClient.emit('project.created', {
      projectSlug: project.slug,
      templateId: project.templateId,
      fileSystemPath: project.fileSystemPath,
    });

    return {
      project: this.toProtoProject(project),
    };
  }

  async getProject({ slug, userId }: GetProjectRequest) {
    this.logger.log(`User: ${userId} requested to get project: ${slug}`);

    const project = await this.prisma.project.findUnique({
      where: {
        slug,
        userId,
      },
    });

    if (!project) {
      this.logger.error(`Project not found with slug ${slug} for user ${userId}`);
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Project does not exist`,
      });
    }

    return {
      project: this.toProtoProject(project),
    };
  }

  editProject({
    slug,
    description,
    visibility,
    templateId,
    fileSystemPath,
    status,
    userId,
  }: EditProjectRequest) {
    this.logger.log(`Requested to edit project: ${slug}`);

    const project: ProtoProject = {
      id: 'mock-project-id',
      slug,
      userId,
      description: description ?? 'Mock project updated by editProject',
      visibility: visibility ?? ProjectVisibility.PROJECT_VISIBILITY_PUBLIC,
      templateId: templateId ?? 'mock-template-id',
      fileSystemPath: fileSystemPath ?? '/tmp/mock-project',
      status: status ?? ProjectStatus.PROJECT_STATUS_STOPPED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { project };
  }

  private toProtoProject(project: Project): ProtoProject {
    return {
      id: project.id,
      slug: project.slug,
      userId: project.userId,
      description: project.description,
      visibility: projectVisibilityFromJSON(`PROJECT_VISIBILITY_${project.visibility}`),
      templateId: project.templateId,
      fileSystemPath: project.fileSystemPath,
      status: projectStatusFromJSON(`PROJECT_STATUS_${project.status}`),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
