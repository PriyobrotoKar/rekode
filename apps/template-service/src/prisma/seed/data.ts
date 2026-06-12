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
  },
];
