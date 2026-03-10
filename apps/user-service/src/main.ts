import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { USER_PACKAGE_NAME } from '@rekode/types/server/proto/user';
import { join } from 'node:path';

import { UserModule } from './user.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.GRPC,
    options: {
      package: USER_PACKAGE_NAME,
      protoPath: join(__dirname, '/packages/proto'),
      url: 'localhost:6002',
    },
  });

  await app.listen();
  logger.log('User service is listening on port 6002');
}
void bootstrap();
