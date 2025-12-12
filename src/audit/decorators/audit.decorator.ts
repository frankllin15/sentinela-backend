import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  targetEntity: string;
}

export const Audit = (action: string, targetEntity: string) =>
  SetMetadata(AUDIT_KEY, { action, targetEntity } as AuditMetadata);
