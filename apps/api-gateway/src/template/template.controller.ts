import { Controller, Get, Inject } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import {
  TEMPLATE_PACKAGE_NAME,
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
} from '@rekode/types/server/proto/template';

@Controller('template')
export class TemplateController {
  private templateService!: TemplateServiceClient;
  constructor(@Inject(TEMPLATE_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.templateService = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  @Get()
  getAllTemplates() {
    return this.templateService.getAllTemplates({});
  }
}
