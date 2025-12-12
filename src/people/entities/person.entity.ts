import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('people')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  // Identificação
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 14, unique: true, nullable: true })
  cpf: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rg: string | null;

  @Column({ name: 'voter_id', type: 'varchar', length: 20, nullable: true })
  voterId: string | null;

  // Localização
  @Column({ name: 'address_primary', type: 'text' })
  addressPrimary: string;

  @Column({ name: 'address_secondary', type: 'text', nullable: true })
  addressSecondary: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  // Filiação
  @Column({ name: 'mother_name', type: 'varchar', length: 255, nullable: true })
  motherName: string | null;

  @Column({ name: 'father_name', type: 'varchar', length: 255, nullable: true })
  fatherName: string | null;

  // Mandado
  @Column({ name: 'warrant_status', type: 'text', nullable: true })
  warrantStatus: string | null;

  @Column({
    name: 'warrant_file_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  warrantFileUrl: string | null;

  // Metadados
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_confidential', type: 'boolean', default: false })
  isConfidential: boolean;

  // Auditoria - Relacionamentos com User
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'created_by', type: 'integer' })
  createdBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User | null;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy: number | null;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
