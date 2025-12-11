import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Force } from '../forces/entities/force.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Force, User])],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
