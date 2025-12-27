import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Force } from '../../forces/entities/force.entity';

export enum UserRole {
  ADMIN_GERAL = 'admin_geral',
  PONTO_FOCAL = 'ponto_focal',
  GESTOR = 'gestor',
  USUARIO = 'usuario',
}

export const UserRolesArray = [
  UserRole.ADMIN_GERAL,
  UserRole.PONTO_FOCAL,
  UserRole.GESTOR,
  UserRole.USUARIO,
];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USUARIO,
  })
  role: UserRole;

  @ManyToOne(() => Force, (force) => force.users, { nullable: true })
  @JoinColumn({ name: 'force_id' })
  force?: Force;

  @Column({ name: 'force_id', type: 'integer', nullable: true })
  forceId?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
