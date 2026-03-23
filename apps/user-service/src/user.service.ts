import { status } from '@grpc/grpc-js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { CreateUserIfNotExistsRequest, UpdateUserRequest } from '@rekode/types/server/proto/user';

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

  async getUser(id: string) {
    this.logger.log(`Requested to get user with id: ${id}`);

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      this.logger.log(`User with id: ${id} not found`);
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User not found`,
      });
    }

    this.logger.log(`User with id: ${id} found`);

    return {
      user,
    };
  }

  async updateUser({ id, name, image }: UpdateUserRequest) {
    this.logger.log(`Requested to update user with id: ${id}`);
    this.logger.debug({ name, image });

    const { user } = await this.getUser(id);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        image,
      },
    });

    return {
      user: updatedUser,
    };
  }
}
