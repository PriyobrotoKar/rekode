import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { TEMPLATE_PACKAGE_NAME } from '@rekode/types/server/proto/template';
import { join } from 'node:path';

import { TemplateModule } from './template.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TemplateModule, {
    transport: Transport.GRPC,
    options: {
      package: TEMPLATE_PACKAGE_NAME,
      protoPath: join(__dirname, '/packages/proto'),
      url: 'localhost:6003',
    },
  });

  await app.listen();
  logger.log('Template service is listening on port 6003');
}
void bootstrap();
