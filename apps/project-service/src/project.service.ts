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
import {
  ProjectStatus as PrismaProjectStatus,
  ProjectVisibility as PrismaProjectVisibility,
} from './generated/prisma/enums';
import { ProjectUpdateInput } from './generated/prisma/models';
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

  private readonly projectStatusMap: Record<ProjectStatus, PrismaProjectStatus | undefined> = {
    [ProjectStatus.UNRECOGNIZED]: undefined,
    [ProjectStatus.PROJECT_STATUS_UNSPECIFIED]: PrismaProjectStatus.DEAD,
    [ProjectStatus.PROJECT_STATUS_CREATED]: PrismaProjectStatus.CREATED,
    [ProjectStatus.PROJECT_STATUS_RUNNING]: PrismaProjectStatus.RUNNING,
    [ProjectStatus.PROJECT_STATUS_PAUSED]: PrismaProjectStatus.PAUSED,
    [ProjectStatus.PROJECT_STATUS_RESTARTING]: PrismaProjectStatus.RESTARTING,
    [ProjectStatus.PROJECT_STATUS_REMOVING]: PrismaProjectStatus.REMOVING,
    [ProjectStatus.PROJECT_STATUS_EXITED]: PrismaProjectStatus.EXITED,
    [ProjectStatus.PROJECT_STATUS_DEAD]: PrismaProjectStatus.DEAD,
    [ProjectStatus.PROJECT_STATUS_ERROR]: PrismaProjectStatus.DEAD,
  };

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
        status: PrismaProjectStatus.CREATED,
      },
    });

    this.kafkaClient.emit('project.created', {
      projectSlug: project.slug,
      userId: project.userId,
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

  async editProject(dto: EditProjectRequest) {
    this.logger.log(`Requested to edit project: ${dto.slug}`);

    const project = await this.prisma.project.findUnique({
      where: {
        slug: dto.slug,
        userId: dto.userId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      this.logger.error(`Project not found with slug ${dto.slug} for user ${dto.userId}`);
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Project does not exist`,
      });
    }

    const mappedVisibility =
      dto.visibility === undefined || dto.visibility === null
        ? undefined
        : this.projectVisibilityMap[dto.visibility];

    const mappedStatus =
      dto.status === undefined || dto.status === null
        ? undefined
        : this.projectStatusMap[dto.status];

    const data = Object.fromEntries(
      Object.entries({
        description: dto.description,
        visibility: mappedVisibility,
        templateId: dto.templateId,
        fileSystemPath: dto.fileSystemPath,
        status: mappedStatus,
        containerUrl: dto.containerUrl,
      }).filter(([, value]) => value !== undefined),
    ) as ProjectUpdateInput;

    if (Object.keys(data).length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `No fields provided to update`,
      });
    }

    const updatedProject = await this.prisma.project.update({
      where: {
        id: project.id,
      },
      data,
    });

    return { project: this.toProtoProject(updatedProject) };
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
      containerUrl: project.containerUrl,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
