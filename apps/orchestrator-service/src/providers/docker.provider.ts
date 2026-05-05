import { CreateContainterInput, IContainerProvider } from '@/interfaces/container-provider';
import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';

@Injectable()
export class DockerProvider implements IContainerProvider {
  private readonly docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async createContainer(input: CreateContainterInput): Promise<void> {
    const container = await this.docker.createContainer({
      Image: 'ubuntu',
      name: input.projectSlug,
      Tty: true,
      Env: [
        `TEMPLATE_FOLDER_PATH=${input.templateFolderPath}`,
        `FILE_SYSTEM_PATH=${input.fileSystemPath}`,
      ],
    });

    await container.start();
  }
}
