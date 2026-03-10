import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserIfNotExistsRequest } from '@rekode/types/server/proto/user';

import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async createUserIfNotExists({ email, name, image }: CreateUserIfNotExistsRequest) {
    this.logger.log(`Requested to create a new user with email: ${email}`);

    const isUserExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!isUserExists) {
      this.logger.log(`User with email: ${email} does not exist, creating...`);
      const newUser = await this.prisma.user.create({
        data: {
          email,
          name,
          image,
        },
      });

      this.kafkaClient.emit('user.created', { email, name, image });

      return {
        user: newUser,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: isUserExists.id,
      },
      data: {
        name,
        image,
      },
    });

    this.logger.log(`User ${email} already exists, updated with new fields`);

    return {
      user: updatedUser,
    };
  }

  getUser(id: string) {
    return {
      user: {
        id,
        email: 'xyz@gmail.com',
        name: 'xyz',
        image: 'https://something.cdn.com/xyz',
      },
    };
  }
}
