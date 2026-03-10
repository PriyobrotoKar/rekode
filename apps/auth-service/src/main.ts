import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rekode/types/server/proto/auth';
import { join } from 'node:path';

import { AuthModule } from './auth.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AuthModule, {
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: join(__dirname, 'packages/auth.proto'),
      url: 'localhost:6001',
    },
  });

  await app.listen();
  logger.log('Auth service is listening on port 6001');
}
void bootstrap();
