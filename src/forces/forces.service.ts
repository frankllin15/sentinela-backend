import { Injectable } from '@nestjs/common';
import { CreateForceDto } from './dto/create-force.dto';
import { UpdateForceDto } from './dto/update-force.dto';

@Injectable()
export class ForcesService {
  create(createForceDto: CreateForceDto) {
    return 'This action adds a new force';
  }

  findAll() {
    return `This action returns all forces`;
  }

  findOne(id: number) {
    return `This action returns a #${id} force`;
  }

  update(id: number, updateForceDto: UpdateForceDto) {
    return `This action updates a #${id} force`;
  }

  remove(id: number) {
    return `This action removes a #${id} force`;
  }
}
