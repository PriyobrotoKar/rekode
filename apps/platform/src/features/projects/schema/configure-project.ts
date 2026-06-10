import { ProjectVisibility } from '@rekode/types/client/proto/project';
import { IconLock, type IconProps, IconUser } from '@tabler/icons-react';
import z from 'zod';

const VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE'] as const;

export const visibility_items: Record<Exclude<ProjectVisibility, 0 | -1>, React.FC<IconProps>> = {
  [ProjectVisibility.PROJECT_VISIBILITY_PUBLIC]: IconUser,
  [ProjectVisibility.PROJECT_VISIBILITY_PRIVATE]: IconLock,
};

export const configureProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
  visibility: z.enum(ProjectVisibility),
  description: z.string().max(500, 'Description is too long').optional(),
  initializeGit: z.boolean(),
});

export type ConfigureProjectSchema = z.infer<typeof configureProjectSchema>;
