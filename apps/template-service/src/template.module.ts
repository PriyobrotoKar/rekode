import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisConfigService } from './lib/redis.service';
import { PrismaModule } from './prisma/prisma.module';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
