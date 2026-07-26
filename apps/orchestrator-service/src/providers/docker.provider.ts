import {
  CreateContainerOutput,
  CreateContainterInput,
  IContainerProvider,
} from '@/interfaces/container-provider';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';

@Injectable()
export class DockerProvider implements IContainerProvider {
  private readonly docker: Docker;

  constructor(private readonly configService: ConfigService) {
    this.docker = new Docker();
  }

  async createContainer(input: CreateContainterInput): Promise<CreateContainerOutput> {
    const container = await this.docker.createContainer({
      Image: 'rekode/container-runtime',
      name: input.projectSlug,
      Tty: true,
      Env: [
        `REPO_URL=${input.templateRepoUrl}`,
        `FILE_SYSTEM_PATH=${input.fileSystemPath}`,
        `CONTAINER_NAME=${input.projectSlug}`,
        `INSTALL_CMD=${input.installCmd}`,
        `BUILD_CMD=${input.buildCmd}`,
        `START_CMD=${input.startCmd}`,
        `RCLONE_S3_PROVIDER=AWS`,
        `RCLONE_S3_ACCESS_KEY_ID=${this.configService.get('AWS_ACCESS_KEY_ID')}`,
        `RCLONE_S3_SECRET_ACCESS_KEY=${this.configService.get('AWS_SECRET_ACCESS_KEY')}`,
        `RCLONE_S3_REGION=${this.configService.get('AWS_S3_REGION')}`,
        `S3_BUCKET=${this.configService.get('S3_BUCKET')}`,
      ],
    });

    const network = this.docker.getNetwork('rekode_container-net');

    await container.start();

    network.connect({ Container: container.id });

    const info = await this.inspectContainer(container);

    const containerName = info.Name;
    const containerUrl = `http://${containerName}.localhost`;
    const containerStatus = info.State.Status;

    return {
      containerUrl,
      containerStatus,
      containerName,
    };
  }

  private async inspectContainer(
    container: Docker.Container,
  ): Promise<Docker.ContainerInspectInfo> {
    return new Promise((resolve, reject) => {
      container.inspect({}, (error, info) => {
        if (error || !info) {
          reject(error);
          return;
        }

        resolve(info);
      });
    });
  }
}
