import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { OrchestratorModule } from './orchestrator.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrchestratorModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'orchestrator-consumer-group',
      },
    },
  });

  await app.listen();
  logger.log('Orchestrator service is listening to kafka');
}
void bootstrap();
