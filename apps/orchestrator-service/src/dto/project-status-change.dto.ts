import { ProjectStatus } from '@rekode/types/server/proto/project';

export interface ProjectStatusChangedDto {
  projectSlug: string;
  status: ProjectStatus;
}
