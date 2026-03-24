/**
 * Audit column definitions.
 *
 * The audit trail uses a custom table implementation with expandable rows
 * (AuditTrail component) rather than the standard DataTable, so column
 * definitions are embedded directly in the AuditTrail component.
 *
 * This file exports label mappings used across audit-related UI.
 */

export const auditActionLabels: Record<string, string> = {
  CREATE: 'Utworzenie',
  UPDATE: 'Edycja',
  DELETE: 'Usuniecie',
};

export const auditEntityTypeLabels: Record<string, string> = {
  Vehicle: 'Pojazd',
  Customer: 'Klient',
  Rental: 'Wynajem',
  Contract: 'Umowa',
};
