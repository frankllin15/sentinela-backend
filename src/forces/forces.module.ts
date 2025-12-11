import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForcesService } from './forces.service';
import { ForcesController } from './forces.controller';
import { Force } from './entities/force.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Force])],
  controllers: [ForcesController],
  providers: [ForcesService],
  exports: [TypeOrmModule],
})
export class ForcesModule {}
