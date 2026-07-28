import { useMemo, useState } from 'react';

import { getAllTemplatesQueryOptions } from '@/features/projects/queries';
import { TemplateCard } from '@/features/templates/components/template-card';
import { Environment, type Template } from '@rekode/types/client/proto/template';
import { IconPlayerPlay, IconSearch, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@rekode/ui/components/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@rekode/ui/components/input-group';
import { Kbd } from '@rekode/ui/components/kbd';

import { configureProjectDialogOpenAtom, templateAtom } from '../lib/atoms';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_ENVIRONMENTS,
  type TemplateCategory,
} from '../lib/constants';

interface CreateProjectDialogProps {
  trigger?: React.ReactElement;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useAtom(templateAtom);
  const { data: templates = [], isLoading } = useQuery(getAllTemplatesQueryOptions);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        search.trim().length === 0 ||
        template.slug.toLowerCase().includes(search.toLowerCase()) ||
        template.technologies.some((technology) =>
          technology.toLowerCase().includes(search.toLowerCase()),
        );

      const matchesCategory =
        category === null ||
        (category === 'browser' && template.environment === Environment.ENVIRONMENT_BROWSER) ||
        (category === 'server' && template.environment === Environment.ENVIRONMENT_SERVER) ||
        (category === 'javascript' && template.language.toLowerCase().includes('javascript')) ||
        (category === 'python' && template.language.toLowerCase().includes('python')) ||
        (category === 'go' && template.language.toLowerCase().includes('go')) ||
        (category === 'fullstack' && template.technologies.length > 1);

      return matchesSearch && matchesCategory;
    });
  }, [category, search, templates]);

  const popular = filteredTemplates.slice(0, 4);

  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="default" size="sm">
              <IconPlayerPlay data-icon="inline-start" />
              Start with template
            </Button>
          )
        }
      />
      <DialogContent
        className="max-h-[88vh] gap-0 overflow-hidden border p-0 sm:max-w-[min(960px,calc(100%-2rem))]"
        showCloseButton={false}
      >
        <ProjectDialogHeader />
        <div className="grid min-h-140 grid-cols-1 md:grid-cols-[220px_1fr]">
          <CategorySidebar activeCategory={category} onCategoryChange={setCategory} />
          <div className="flex flex-col">
            <TemplatesPanel
              isLoading={isLoading}
              search={search}
              onSearchChange={setSearch}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              templateCount={filteredTemplates.length}
              recentlyUsed={[]}
              popular={popular}
            />
            <ProjectDialogFooter canContinue={selectedTemplate !== null} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialogHeader() {
  return (
    <DialogHeader className="border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <DialogTitle>Create new project</DialogTitle>
        <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
          <IconX className="size-4" />
        </DialogClose>
      </div>
    </DialogHeader>
  );
}

function CategorySidebar({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: TemplateCategory | null;
  onCategoryChange: (category: TemplateCategory | null) => void;
}) {
  return (
    <aside className="border-b p-2 md:border-r md:border-b-0">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Categories
      </span>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
        {[...TEMPLATE_CATEGORIES, ...TEMPLATE_ENVIRONMENTS].map((item) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;

          return (
            <Button
              key={item.id}
              size={'sm'}
              variant={'ghost'}
              onClick={() => onCategoryChange(isActive ? null : item.id)}
              className="data-[active=true]:bg-accent justify-start"
              data-active={isActive}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </aside>
  );
}

function TemplatesPanel({
  isLoading,
  search,
  onSearchChange,
  selectedTemplate,
  onSelectTemplate,
  templateCount,
  recentlyUsed,
  popular,
}: {
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedTemplate: string | 'blank' | null;
  onSelectTemplate: (value: string | 'blank') => void;
  templateCount: number;
  recentlyUsed: Template[];
  popular: Template[];
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 px-3 py-2">
      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-md font-medium">{templateCount} available templates</h3>
            <p className="text-muted-foreground text-xs">
              Choose a template or start a blank project
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <SearchTemplatesInput value={search} onChange={onSearchChange} />
            <Button variant={'secondary'} size={'sm'} onClick={() => onSelectTemplate('blank')}>
              Blank Project
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto">
        <TemplateSection
          title="Recently Used"
          templates={recentlyUsed}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
          isLoading={isLoading}
        />
        <TemplateSection
          title="Popular"
          templates={popular}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function SearchTemplatesInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <IconSearch className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search templates"
      />
      <InputGroupAddon align="inline-end">
        <Kbd className="size-4">/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}

function TemplateSection({
  title,
  templates,
  selectedTemplate,
  onSelectTemplate,
  isLoading,
}: {
  title: string;
  templates: Template[];
  selectedTemplate: string | 'blank' | null;
  onSelectTemplate: (value: string) => void;
  isLoading: boolean;
}) {
  if (!isLoading && templates.length === 0) return null;

  return (
    <div>
      <h4 className="text-muted-foreground mb-3 text-sm font-medium">{title}</h4>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const isSelected = selectedTemplate === template.id;

            return (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={isSelected}
                onClick={() => onSelectTemplate(template.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectDialogFooter({ canContinue }: { canContinue: boolean }) {
  const setConfigureProjectDialogOpenAtom = useSetAtom(configureProjectDialogOpenAtom);

  return (
    <div className="border-t p-2">
      <div className="flex justify-end">
        <Button
          size={'sm'}
          disabled={!canContinue}
          onClick={() => setConfigureProjectDialogOpenAtom(true)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
