import { TemplateEnvironment } from '@/generated/prisma/enums';
import { TemplateCreateInput } from '@/generated/prisma/models';

export const templates: Omit<TemplateCreateInput, 'id'>[] = [
  {
    slug: 'astro',
    description:
      "Brutal is a minimal neobrutalist theme for Astro. It's based on Neobrutalist Web Design, a movement that aims to create websites with a minimalistic and functional design. It has some integrations like Image Optimization, RSS, Sitemap, ready to get your SEO done right.",
    technologies: ['astro', 'typescript'],
    language: 'javascript',
    environment: TemplateEnvironment.BROWSER,
    repoUrl: 'https://github.com/eliancodes/brutal',
    installCmd: 'npm install',
    buildCmd: 'npm run build',
    startCmd: 'npm run start -- --host',
  },
  {
    slug: 'nextjs',
    description:
      'Studio Admin - Includes multiple dashboards, authentication layouts, customizable theme presets, and more.',
    technologies: ['nextjs', 'tailwind'],
    language: 'javascript',
    environment: TemplateEnvironment.SERVER,
    repoUrl: 'https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git',
    installCmd: 'npm install',
    buildCmd: 'npm run build',
    startCmd: 'npm run dev',
  },
];
