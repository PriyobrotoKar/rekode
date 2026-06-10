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
      ExposedPorts: {
        ['9999/tcp']: {},
      },
      HostConfig: {
        PortBindings: {
          '9999/tcp': [
            {
              HostPort: '0',
            },
          ],
        },
      },
      Env: [`REPO_URL=${input.templateRepoUrl}`, `FILE_SYSTEM_PATH=${input.fileSystemPath}`],
    });

    await container.start();

    const info = await this.inspectContainer(container);

    const port = Object.values(info.NetworkSettings.Ports)[0]?.[0];

    if (!port) {
      throw new Error('Port not found');
    }

    const containerUrl = `http://localhost:${port.HostPort}`;

    const containerStatus = info.State.Status;

    return {
      containerUrl,
      containerStatus,
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
