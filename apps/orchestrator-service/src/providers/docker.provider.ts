import {
  CreateContainerOutput,
  CreateContainterInput,
  IContainerProvider,
} from '@/interfaces/container-provider';
import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';

@Injectable()
export class DockerProvider implements IContainerProvider {
  private readonly docker: Docker;

  constructor() {
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
