import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCode, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { Checkbox } from '@rekode/ui/components/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@rekode/ui/components/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@rekode/ui/components/field';
import { Input } from '@rekode/ui/components/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rekode/ui/components/select';
import { Textarea } from '@rekode/ui/components/textarea';

import { configureProjectDialogOpenAtom, templateAtom } from '../lib/atoms';
import { getAllTemplatesQueryOptions } from '../queries';
import {
  type ConfigureProjectSchema,
  configureProjectSchema,
  visibility_items,
} from '../schema/configure-project';

export function ConfigureProjectDialog() {
  const [open, setOpen] = useAtom(configureProjectDialogOpenAtom);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className={'gap-0 border p-0 sm:max-w-[min(960px,calc(100%-2rem))]'}
      >
        <DialogHeader className="border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <DialogTitle>Configure Project</DialogTitle>
            <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
              <IconX className="size-4" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex h-full min-h-140">
          <TemplateDetails />
          <div className="flex h-full flex-1 flex-col">
            <ConfigureProjectForm />
            <ConfigureProjectDialogFooter />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDetails() {
  const selectedTemplate = useAtomValue(templateAtom);
  const { data: templates = [] } = useQuery(getAllTemplatesQueryOptions);

  const templateData = templates.find((template) => template.id === selectedTemplate);

  if (!templateData) return null;

  return (
    <div className="h-full w-56 grow-0 space-y-4 border-r p-5">
      <IconCode className="size-8" />
      <div className="space-y-2">
        <h2 className="text-md">{templateData.slug}</h2>
        <p className="text-muted-foreground text-xs text-balance">{templateData.description}</p>
      </div>
    </div>
  );
}

function ConfigureProjectForm() {
  const form = useForm<ConfigureProjectSchema>({
    resolver: zodResolver(configureProjectSchema),
    defaultValues: {
      name: '',
      visibility: 'PUBLIC',
      description: '',
      initializeGit: true,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <div className="max-w-md flex-1 px-3 py-2">
      <form className="space-y-5" id="configure-project-form" onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} size="sm">
                Name
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                placeholder="Enter project name"
                size="sm"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="visibility"
          render={({ field, fieldState }) => {
            const SelectedIcon = visibility_items[field.value];

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} size="sm">
                  Visibility
                </FieldLabel>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={field.name} size="sm" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select" className={'capitalize'}>
                      {SelectedIcon && <SelectedIcon />} {field.value.toLowerCase()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(visibility_items).map(([option, Icon]) => (
                        <SelectItem key={option} value={option} className={'capitalize'}>
                          <Icon /> {option.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => {
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} size="sm">
                  Visibility
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Write a description for this project"
                  className="min-h-32"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        <Controller
          control={form.control}
          name="initializeGit"
          render={({ field, fieldState }) => {
            return (
              <Field orientation="horizontal">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Initialize Git Repository</FieldLabel>
                  <FieldDescription>
                    Creates a fresh Git repo in your project so you can track changes from day one.
                  </FieldDescription>
                </FieldContent>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
      </form>
    </div>
  );
}

function ConfigureProjectDialogFooter() {
  return (
    <div className="border-t p-2">
      <div className="flex justify-end gap-2">
        <DialogClose>
          <Button size={'sm'} variant={'secondary'}>
            Back
          </Button>
        </DialogClose>
        <Button size={'sm'} form="configure-project-form" type="submit">
          Create Project
        </Button>
      </div>
    </div>
  );
}
