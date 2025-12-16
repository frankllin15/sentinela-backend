import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { BusinessException } from '../exceptions/business.exception';

/**
 * Filtro global de exceções
 *
 * Responsabilidades:
 * 1. Interceptar todas as exceções da aplicação
 * 2. Transformar em formato padronizado (ErrorResponseDto)
 * 3. Classificar como user-facing ou técnica
 * 4. Sanitizar erros de banco de dados
 * 5. Ocultar detalhes técnicos em produção
 * 6. Logar erros críticos
 *
 * Aplicado globalmente via APP_FILTER no CommonModule
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Logar erros críticos (5xx) e de segurança (401, 403)
    if (
      errorResponse.statusCode >= 500 ||
      errorResponse.statusCode === HttpStatus.UNAUTHORIZED.valueOf() ||
      errorResponse.statusCode === HttpStatus.FORBIDDEN.valueOf()
    ) {
      this.logger.error(
        `${errorResponse.method} ${errorResponse.path} - ${errorResponse.statusCode} - ${errorResponse.errorCode}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Constrói a resposta de erro padronizada
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponseDto {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. BusinessException (sempre user-facing)
    if (exception instanceof BusinessException) {
      return {
        statusCode: exception.getStatus(),
        timestamp,
        path,
        method,
        errorCode: exception.errorCode,
        message: exception.message,
        isUserFacing: true,
      };
    }

    // 2. HttpException do NestJS (geralmente user-facing)
    if (exception instanceof HttpException) {
      return this.handleHttpException(
        exception,
        timestamp,
        path,
        method,
        isProduction,
      );
    }

    // 3. TypeORM QueryFailedError (erros de banco de dados)
    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseError(
        exception,
        timestamp,
        path,
        method,
        isProduction,
      );
    }

    // 4. TypeORM EntityNotFoundError
    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp,
        path,
        method,
        errorCode: 'ENTITY_NOT_FOUND',
        message: 'Recurso não encontrado',
        isUserFacing: true,
      };
    }

    // 5. Erros inesperados (500)
    return this.handleUnexpectedError(
      exception,
      timestamp,
      path,
      method,
      isProduction,
    );
  }

  /**
   * Trata HttpException do NestJS
   */
  private handleHttpException(
    exception: HttpException,
    timestamp: string,
    path: string,
    method: string,
    isProduction: boolean,
  ): ErrorResponseDto {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Tratar ValidationPipe errors (class-validator)
    if (
      status === HttpStatus.BAD_REQUEST.valueOf() &&
      typeof exceptionResponse === 'object'
    ) {
      const response = exceptionResponse as any;

      // ValidationPipe retorna array de mensagens
      if (Array.isArray(response.message)) {
        return {
          statusCode: status,
          timestamp,
          path,
          method,
          errorCode: 'VALIDATION_ERROR',
          message: response.message,
          isUserFacing: true,
          details: !isProduction ? { validation: response.message } : undefined,
        };
      }
    }

    // HttpException padrão (NotFoundException, ConflictException, etc.)
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Erro desconhecido';

    const errorCode = this.mapHttpStatusToErrorCode(
      status,
      exception.constructor.name,
    );
    const isUserFacing = this.isHttpExceptionUserFacing(status);

    return {
      statusCode: status,
      timestamp,
      path,
      method,
      errorCode,
      message,
      isUserFacing,
      details: !isProduction
        ? {
            exception: exception.constructor.name,
          }
        : undefined,
    };
  }

  /**
   * Trata erros de banco de dados (TypeORM QueryFailedError)
   * Sanitiza mensagens e transforma em erros user-friendly
   */
  private handleDatabaseError(
    error: QueryFailedError,
    timestamp: string,
    path: string,
    method: string,
    isProduction: boolean,
  ): ErrorResponseDto {
    const driverError = error.driverError as any;
    const pgErrorCode = driverError?.code;

    // PostgreSQL 23505: Unique constraint violation
    if (pgErrorCode === '23505') {
      const message = this.extractUserFriendlyConstraintMessage(driverError);
      return {
        statusCode: HttpStatus.CONFLICT,
        timestamp,
        path,
        method,
        errorCode: 'UNIQUE_CONSTRAINT_VIOLATION',
        message,
        isUserFacing: true,
        details: !isProduction
          ? {
              constraint: driverError.constraint,
            }
          : undefined,
      };
    }

    // PostgreSQL 23503: Foreign key constraint violation
    if (pgErrorCode === '23503') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        errorCode: 'FOREIGN_KEY_VIOLATION',
        message: 'Operação não permitida devido a dependências',
        isUserFacing: true,
        details: !isProduction
          ? {
              constraint: driverError.constraint,
            }
          : undefined,
      };
    }

    // PostgreSQL 23502: Not null violation
    if (pgErrorCode === '23502') {
      const columnName = driverError.column || 'campo obrigatório';
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        errorCode: 'NOT_NULL_VIOLATION',
        message: `${columnName} é obrigatório`,
        isUserFacing: true,
        details: !isProduction
          ? {
              column: driverError.column,
            }
          : undefined,
      };
    }

    // PostgreSQL 22P02: Invalid text representation (tipo de dado inválido)
    if (pgErrorCode === '22P02') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        errorCode: 'INVALID_DATA_TYPE',
        message: 'Tipo de dado inválido fornecido',
        isUserFacing: true,
      };
    }

    // Erro genérico de banco de dados (ocultar detalhes)
    this.logger.error('Database error:', {
      code: pgErrorCode,
      message: driverError?.message,
      detail: driverError?.detail,
    });

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      errorCode: 'DATABASE_ERROR',
      message: 'Erro ao processar operação no banco de dados',
      isUserFacing: false,
      details: !isProduction
        ? {
            exception: 'QueryFailedError',
            pgCode: pgErrorCode,
          }
        : undefined,
    };
  }

  /**
   * Trata erros inesperados
   */
  private handleUnexpectedError(
    exception: unknown,
    timestamp: string,
    path: string,
    method: string,
    isProduction: boolean,
  ): ErrorResponseDto {
    // Logar erro completo para investigação
    this.logger.error('Unexpected error:', exception);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      isUserFacing: false,
      details: !isProduction
        ? {
            exception:
              exception instanceof Error
                ? exception.constructor.name
                : 'Unknown',
            message: exception instanceof Error ? exception.message : undefined,
            stack: exception instanceof Error ? exception.stack : undefined,
          }
        : undefined,
    };
  }

  /**
   * Mapeia status HTTP para código de erro
   */
  private mapHttpStatusToErrorCode(
    status: number,
    exceptionName: string,
  ): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return (
      codeMap[status] || exceptionName.replace('Exception', '').toUpperCase()
    );
  }

  /**
   * Determina se um HttpException é user-facing
   * 4xx (client errors) geralmente são user-facing
   * 5xx (server errors) não são user-facing
   */
  private isHttpExceptionUserFacing(status: number): boolean {
    return status >= 400 && status < 500;
  }

  /**
   * Extrai mensagem amigável de erros de constraint violation
   * Tenta identificar o campo pelo detail do erro PostgreSQL
   */
  private extractUserFriendlyConstraintMessage(driverError: any): string {
    const detail = driverError.detail || '';
    const constraint = driverError.constraint || '';

    // Tentar identificar campo específico
    if (detail.includes('email') || constraint.includes('email')) {
      return 'Este email já está em uso';
    }
    if (detail.includes('cpf') || constraint.includes('cpf')) {
      return 'Este CPF já está cadastrado';
    }
    if (detail.includes('name') || constraint.includes('name')) {
      return 'Este nome já está em uso';
    }
    if (detail.includes('rg') || constraint.includes('rg')) {
      return 'Este RG já está cadastrado';
    }

    // Mensagem genérica
    return 'Registro duplicado no sistema';
  }
}
