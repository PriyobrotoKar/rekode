import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FastifyReply } from 'fastify';

interface GrpcError {
  code: number;
  message: string;
  details: string;
  metadata?: unknown;
}

function isGrpcError(error: unknown): error is GrpcError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'details' in error &&
    typeof (error as GrpcError).code === 'number' &&
    typeof (error as GrpcError).details === 'string'
  );
}

@Catch()
export class IIRpcExceptionFilter implements ExceptionFilter {
  logger = new Logger(IIRpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    this.logger.error(exception);

    if (exception instanceof RpcException) {
      const error = exception.getError();

      if (typeof error === 'object' && error !== null && 'status' in error) {
        status = (error as { status: number }).status;
      }

      message = exception.message;
    } else if (isGrpcError(exception)) {
      // Handle gRPC errors
      status = grpcToHttpStatus[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.details;
    } else if (exception instanceof Error) {
      // Check if it's a gRPC error in string format (e.g., "2 UNKNOWN: message")
      const grpcErrorMatch = exception.message.match(/^(\d+)\s+\w+:\s*(.+)$/);

      if (grpcErrorMatch && grpcErrorMatch[1] && grpcErrorMatch[2]) {
        message = grpcErrorMatch[2];
        const grpcCode = parseInt(grpcErrorMatch[1], 10);

        status = grpcToHttpStatus[grpcCode] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      } else {
        message = exception.message;
      }
    }

    response.status(status).send({
      statusCode: status,
      message: message,
      error: errorNames[status] ?? 'RpcException',
    });
  }
}

// Map gRPC status codes to HTTP status codes
const grpcToHttpStatus: Record<number, number> = {
  [GrpcStatus.OK]: HttpStatus.OK,
  [GrpcStatus.CANCELLED]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
  [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [GrpcStatus.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_FAILED,
  [GrpcStatus.ABORTED]: HttpStatus.CONFLICT,
  [GrpcStatus.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
  [GrpcStatus.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [GrpcStatus.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
};

const errorNames: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.PRECONDITION_FAILED]: 'Precondition Failed',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};
