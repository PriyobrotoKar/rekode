import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { PROJECT_PACKAGE_NAME } from '@rekode/types/server/proto/project';
import { join } from 'node:path';

import { ProjectModule } from './project.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ProjectModule, {
    transport: Transport.GRPC,
    options: {
      package: PROJECT_PACKAGE_NAME,
      protoPath: join(__dirname, '/packages/proto'),
      url: 'localhost:6004',
    },
  });

  await app.listen();
  logger.log('Project service is listening on port 6004');
}
void bootstrap();
