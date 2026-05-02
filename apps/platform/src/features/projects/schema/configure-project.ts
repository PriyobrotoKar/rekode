import { IconLock, IconUser } from '@tabler/icons-react';
import z from 'zod';

const VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE'] as const;

export const visibility_items = {
  PUBLIC: IconUser,
  PRIVATE: IconLock,
};

export const configureProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
  visibility: z.enum(VISIBILITY_OPTIONS),
  description: z.string().max(500, 'Description is too long').optional(),
  initializeGit: z.boolean(),
});

export type ConfigureProjectSchema = z.infer<typeof configureProjectSchema>;
