import { TemplateEnvironment } from '@/generated/prisma/enums';
import { TemplateCreateInput } from '@/generated/prisma/models';

export const templates: Omit<TemplateCreateInput, 'id'>[] = [
  {
    slug: 'react-typescript',
    description:
      'A modern React project template with TypeScript support for building type-safe, scalable web applications. Includes best practices, pre-configured tooling, and a solid foundation for developing robust frontend solutions.',
    technologies: ['react', 'typescript'],
    language: 'javascript',
    environment: TemplateEnvironment.BROWSER,
    repoUrl: 'https://github.com/urmilashirole/movieapp.github.io.git',
  },
];
