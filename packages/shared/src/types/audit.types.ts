/**
 * Common audit action strings used across the application.
 * Actions follow the pattern "entity.verb" (e.g., "rental.create")
 * or simple verbs (e.g., "CREATE", "UPDATE", "DELETE").
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | (string & {});

/**
 * Shape of an audit log entry as returned by the API audit endpoint.
 * Matches the Prisma AuditLog model with the included actor relation.
 */
export interface AuditLogDto {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changesJson: Record<string, { old: unknown; new: unknown }> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}
