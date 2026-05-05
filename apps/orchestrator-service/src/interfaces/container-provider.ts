export const CONTAINER_PROVIDER = 'CONTAINER_PROVIDER';

export interface CreateContainterInput {
  projectSlug: string;
  templateFolderPath: string;
  fileSystemPath: string;
}

export interface IContainerProvider {
  createContainer(input: CreateContainterInput): Promise<void>;
}
