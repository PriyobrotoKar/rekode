import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { type ProjectCreatedDto } from './dto/project-created.dto';
import { OrchestratorService } from './orchestrator.service';

@Controller()
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @MessagePattern('project.created')
  handleProjectCreated(@Payload() data: ProjectCreatedDto) {
    this.orchestratorService.provisionContainer(data);
  }
}
