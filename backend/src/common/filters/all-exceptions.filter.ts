import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const normalizedError = this.normalizeError(exceptionResponse, exception, status);

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...normalizedError,
      timestamp: new Date().toISOString()
    });
  }

  private normalizeError(
    exceptionResponse: (HttpException["getResponse"] extends () => infer T ? T : unknown) | null,
    exception: unknown,
    status: number
  ) {
    if (Array.isArray(exceptionResponse)) {
      return {
        message: "Validation failed",
        details: exceptionResponse
      };
    }

    if (typeof exceptionResponse === "string") {
      return { message: exceptionResponse };
    }

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const payload = exceptionResponse as Record<string, unknown>;
      const rawMessage = payload.message;

      if (Array.isArray(rawMessage)) {
        return {
          message: "Validation failed",
          details: rawMessage
        };
      }

      if (typeof rawMessage === "string") {
        return { message: rawMessage };
      }

      if (typeof payload.error === "string") {
        return { message: payload.error };
      }
    }

    return {
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? "Internal server error"
          : exception instanceof Error
            ? exception.message
            : "Request failed"
    };
  }
}
