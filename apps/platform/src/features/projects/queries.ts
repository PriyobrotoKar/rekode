import { TemplateController } from '@/features/templates/api';
import { queryOptions } from '@tanstack/react-query';

export const getAllTemplatesQueryOptions = queryOptions({
  queryKey: ['templates'],
  queryFn: async () => {
    const response = await TemplateController.getAllTemplates();
    return response.templates;
  },
});
