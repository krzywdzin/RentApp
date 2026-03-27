import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches every unhandled exception and returns a consistent JSON envelope.
 * Prisma known-request errors are mapped to appropriate HTTP status codes.
 * In production, 500-level responses hide internal details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) ?? exception.message;
        error = (resp.error as string) ?? 'Error';
      }
    } else if (this.isPrismaKnownRequestError(exception)) {
      const prismaError = exception as { code: string; message: string; meta?: Record<string, unknown> };
      switch (prismaError.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          const target = prismaError.meta?.target;
          message = target
            ? `Unique constraint violation on: ${Array.isArray(target) ? target.join(', ') : target}`
            : 'Unique constraint violation';
          error = 'Conflict';
          break;
        }
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'Not Found';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Internal server error';
          error = 'Internal Server Error';
          break;
      }
    }

    // In production, never leak internal details for 500s
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && statusCode >= 500) {
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    // Log all server errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Duck-type check for PrismaClientKnownRequestError to avoid
   * importing @prisma/client/runtime at the filter level.
   */
  private isPrismaKnownRequestError(
    error: unknown,
  ): error is { code: string; message: string; meta?: Record<string, unknown> } {
    if (error === null || typeof error !== 'object') return false;
    const obj = error as Record<string, unknown>;
    return (
      typeof obj.code === 'string' &&
      obj.code.startsWith('P') &&
      obj.constructor?.name === 'PrismaClientKnownRequestError'
    );
  }
}
