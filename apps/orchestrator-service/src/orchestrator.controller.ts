import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectStatus } from '@rekode/types/server/proto/project';

import { type ProjectCreatedDto } from './dto/project-created.dto';
import { type ProjectStatusChangedDto } from './dto/project-status-change.dto';
import { OrchestratorService } from './orchestrator.service';

@Controller()
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @MessagePattern('project.created')
  handleProjectCreated(@Payload() data: ProjectCreatedDto) {
    this.orchestratorService.provisionContainer(data);
  }

  @MessagePattern('project.status.changed')
  handleProjectDestroyed(@Payload() data: ProjectStatusChangedDto) {
    console.log(data);
    switch (data.status) {
      case ProjectStatus.PROJECT_STATUS_EXITED:
        this.orchestratorService.destroyContainer(data);
        break;
    }
  }
}
