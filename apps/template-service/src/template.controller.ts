import { Controller } from '@nestjs/common';
import {
  GetAllTemplatesRequest,
  GetAllTemplatesResponse,
  TemplateServiceController,
  TemplateServiceControllerMethods,
} from '@rekode/types/server/proto/template';
import { Observable } from 'rxjs';

import { TemplateService } from './template.service';

@Controller()
@TemplateServiceControllerMethods()
export class TemplateController implements TemplateServiceController {
  constructor(private readonly templateService: TemplateService) {}

  getAllTemplates(
    request: GetAllTemplatesRequest,
  ):
    | Promise<GetAllTemplatesResponse>
    | Observable<GetAllTemplatesResponse>
    | GetAllTemplatesResponse {
    return this.templateService.getAllTemplates(request);
  }
}
