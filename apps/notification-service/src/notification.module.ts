import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationController } from './notfication.controller';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [NotificationController],
  providers: [EmailService],
})
export class NotificationModule {}
