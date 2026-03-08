import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

import { AppModule } from './app.module';
import { IIRpcExceptionFilter } from './lib/rpc-exception';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app
    .getHttpAdapter()
    .getInstance()
    .addHook(
      'onRequest',
      (
        req: FastifyRequest & { res?: FastifyReply },
        res: FastifyReply & {
          setHeader?: (key: string, value: string) => void;
          end?: (data?: unknown) => void;
        },
        done: HookHandlerDoneFunction,
      ) => {
        // Patch Fastify's response to behave more like Express
        res.setHeader = (key: string, value: string) => {
          res.raw.setHeader(key, value);
        };
        res.end = (data?: unknown) => {
          res.raw.end(data);
        };
        req.res = res;
        done();
      },
    );

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new IIRpcExceptionFilter());

  await app.listen(process.env.PORT ?? 8000);

  logger.log('API Gateway is listening on port ' + (process.env.PORT ?? 8000));
}
void bootstrap();
