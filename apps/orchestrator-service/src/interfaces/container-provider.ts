export const CONTAINER_PROVIDER = 'CONTAINER_PROVIDER';

export interface CreateContainterInput {
  projectSlug: string;
  templateRepoUrl: string;
  installCmd: string;
  buildCmd: string;
  startCmd: string;
  fileSystemPath: string;
}

export interface CreateContainerOutput {
  containerUrl: string;
  containerStatus: string;
  containerName: string;
}

export interface IContainerProvider {
  createContainer(input: CreateContainterInput): Promise<CreateContainerOutput>;
}
