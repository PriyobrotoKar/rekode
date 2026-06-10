export const CONTAINER_PROVIDER = 'CONTAINER_PROVIDER';

export interface CreateContainterInput {
  projectSlug: string;
  templateRepoUrl: string;
  fileSystemPath: string;
}

export interface CreateContainerOutput {
  containerUrl: string;
  containerStatus: string;
}

export interface IContainerProvider {
  createContainer(input: CreateContainterInput): Promise<CreateContainerOutput>;
}
