import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rekode/types/server/proto/auth';
import { PROJECT_PACKAGE_NAME } from '@rekode/types/server/proto/project';
import { TEMPLATE_PACKAGE_NAME } from '@rekode/types/server/proto/template';
import { USER_PACKAGE_NAME } from '@rekode/types/server/proto/user';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/guard/auth.guard';
import { GithubOAuthStrategy } from './auth/strategy/github.strategy';
import { GoogleOAuthStrategy } from './auth/strategy/google.strategy';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import { RefreshJwtStrategy } from './auth/strategy/refresh-jwt.strategy';
import { ProjectController } from './project/project.controller';
import { TemplateController } from './template/template.controller';
import { UserController } from './user/user.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth.proto'),
          url: 'localhost:6001',
        },
      },
      {
        name: USER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: USER_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/user.proto'),
          url: 'localhost:6002',
        },
      },
      {
        name: TEMPLATE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: TEMPLATE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/template.proto'),
          url: 'localhost:6003',
        },
      },
      {
        name: PROJECT_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: PROJECT_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/project.proto'),
          url: 'localhost:6004',
        },
      },
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    TemplateController,
    ProjectController,
  ],
  providers: [
    AppService,
    GoogleOAuthStrategy,
    GithubOAuthStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
