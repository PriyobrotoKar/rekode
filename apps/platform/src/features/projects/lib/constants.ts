import {
  IconCode,
  IconDeviceDesktop,
  type IconProps,
  IconServer,
  IconStack2,
} from '@tabler/icons-react';

type TemplateCategory = 'javascript' | 'python' | 'go' | 'fullstack' | 'browser' | 'server';

const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: React.FC<IconProps> }[] = [
  { id: 'javascript', label: 'Javascript', icon: IconCode },
  { id: 'python', label: 'Python', icon: IconCode },
  { id: 'go', label: 'Go', icon: IconCode },
  { id: 'fullstack', label: 'Fullstack', icon: IconStack2 },
];

const TEMPLATE_ENVIRONMENTS: { id: TemplateCategory; label: string; icon: React.FC<IconProps> }[] =
  [
    { id: 'browser', label: 'Browser', icon: IconDeviceDesktop },
    { id: 'server', label: 'Server', icon: IconServer },
  ];

export { TEMPLATE_CATEGORIES, TEMPLATE_ENVIRONMENTS };

export type { TemplateCategory };

export const lanugageMap = {
  js: 'javascript',
  py: 'python',
  go: 'go',
  yml: 'yaml',
  json: 'json',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  html: 'html',
};
