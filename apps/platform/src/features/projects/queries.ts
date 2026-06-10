import { TemplateController } from '@/features/templates/api';
import type { CreateProjectRequest } from '@rekode/types/client/proto/project';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { ProjectController } from './api';

export const getAllTemplatesQueryOptions = queryOptions({
  queryKey: ['templates'],
  queryFn: async () => {
    const response = await TemplateController.getAllTemplates();
    return response.templates;
  },
});

export const createProjectMutationOptions = mutationOptions({
  mutationFn: (project: Omit<CreateProjectRequest, 'userId'>) =>
    ProjectController.createProject(project),
});

export const getProjectBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { project } = await ProjectController.getProjectBySlug(slug);
      return project;
    },
  });
