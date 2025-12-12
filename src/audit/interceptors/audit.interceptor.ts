import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuditStatus } from '../entities/audit.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const ipAddress = request.ip || request.connection.remoteAddress;

    return next.handle().pipe(
      tap(() => {
        this.auditService
          .log({
            action: auditMetadata.action,
            targetEntity: auditMetadata.targetEntity,
            userId,
            ipAddress,
            status: AuditStatus.SUCCESS,
            details: {
              method: request.method,
              path: request.url,
            },
          })
          .catch((error) => {
            console.error('Erro ao registrar auditoria de sucesso:', error);
          });
      }),
      catchError((error) => {
        this.auditService
          .log({
            action: auditMetadata.action,
            targetEntity: auditMetadata.targetEntity,
            userId,
            ipAddress,
            status: AuditStatus.FAILURE,
            details: {
              method: request.method,
              path: request.url,
              error: error.message || 'Erro desconhecido',
            },
          })
          .catch((auditError) => {
            console.error('Erro ao registrar auditoria de falha:', auditError);
          });

        return throwError(() => error);
      }),
    );
  }
}
