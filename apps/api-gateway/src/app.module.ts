import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rekode/types/server/proto/auth';
import { USER_PACKAGE_NAME } from '@rekode/types/server/proto/user';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { GoogleOAuthStrategy } from './auth/strategy/google.strategy';

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
    ]),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, GoogleOAuthStrategy],
})
export class AppModule {}
