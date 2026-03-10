import KeyvRedis, { KeyvRedisOptions } from '@keyv/redis';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const options: KeyvRedisOptions = {
      namespace: 'user',
      keyPrefixSeparator: ':',
    };

    return {
      stores: [new KeyvRedis(this.configService.getOrThrow('REDIS_URL'), options)],
    };
  }
}
