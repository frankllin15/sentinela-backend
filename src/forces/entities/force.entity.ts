import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('forces')
export class Force {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, length: 100 })
  name: string;

  @OneToMany(() => User, (user) => user.force)
  users: User[];
}
