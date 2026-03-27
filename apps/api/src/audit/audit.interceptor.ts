import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const actorId = request.user?.id ?? null;
    const ipAddress = request.ip || request.connection?.remoteAddress;

    return next.handle().pipe(
      tap((responseBody) => {
        // Extract audit metadata from response if present
        if (responseBody && responseBody.__audit) {
          const audit = responseBody.__audit;
          this.auditService
            .log({
              actorId,
              action: audit.action,
              entityType: audit.entityType,
              entityId: audit.entityId,
              changes: audit.changes ?? {},
              ipAddress,
            })
            .catch((err) => {
              // Audit logging should never break the request
              this.logger.error('Audit log failed', err instanceof Error ? err.stack : err);
            });

          // Remove __audit from the response sent to client
          delete responseBody.__audit;
        } else if (
          responseBody &&
          typeof responseBody === 'object' &&
          responseBody.id
        ) {
          // Fallback: auto-detect entity from response
          // NOTE: old-value contract for Phase 1:
          // In Phase 1, all operations are CREATE-only, so old values are always null.
          // When UPDATE operations are added in Phase 2+, controllers should attach
          // __audit metadata with { old: previousValue, new: newValue } for each
          // changed field. The fallback here uses { old: null, new: request.body }
          // which is correct for creates but insufficient for updates.
          // Future plans MUST either:
          //   (a) Use the __audit response metadata pattern with proper old values, OR
          //   (b) Extend this interceptor to fetch old values before the handler runs
          //       (requires a pre-handler hook, not just post-handler tap).
          const controller = context.getClass().name.replace('Controller', '');
          this.auditService
            .log({
              actorId,
              action: `${controller.toLowerCase()}.${method.toLowerCase()}`,
              entityType: controller,
              entityId: String(responseBody.id),
              changes: { body: { old: null, new: request.body } },
              ipAddress,
            })
            .catch((err) => {
              this.logger.error('Audit log failed', err instanceof Error ? err.stack : err);
            });
        }
      }),
    );
  }
}
