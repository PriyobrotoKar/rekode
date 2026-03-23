//@ts-nocheck
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request: FastifyRequest = ctx.switchToHttp().getRequest();
  return request.user;
});
