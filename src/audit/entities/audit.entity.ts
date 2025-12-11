import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  action: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number | null;

  @Column({ name: 'target_entity', length: 255 })
  targetEntity: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
