import { TemplateEnvironment } from '@/generated/prisma/enums';
import { TemplateCreateInput } from '@/generated/prisma/models';

export const templates: Omit<TemplateCreateInput, 'id'>[] = [
  {
    slug: 'react-typescript',
    description: '',
    technologies: ['react', 'typescript'],
    language: 'javascript',
    environment: TemplateEnvironment.BROWSER,
  },
];
