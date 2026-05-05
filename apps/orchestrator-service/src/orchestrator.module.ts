import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TEMPLATE_PACKAGE_NAME } from '@rekode/types/server/proto/template';
import { join } from 'node:path';

import { CONTAINER_PROVIDER } from './interfaces/container-provider';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { DockerProvider } from './providers/docker.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: TEMPLATE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: TEMPLATE_PACKAGE_NAME,
          protoPath: join(__dirname, 'packages/template.proto'),
          url: 'localhost:6003',
        },
      },
    ]),
  ],
  controllers: [OrchestratorController],
  providers: [
    {
      provide: CONTAINER_PROVIDER,
      useClass: DockerProvider,
    },
    OrchestratorService,
  ],
})
export class OrchestratorModule {}
