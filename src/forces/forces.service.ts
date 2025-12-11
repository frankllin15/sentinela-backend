import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateForceDto } from './dto/create-force.dto';
import { UpdateForceDto } from './dto/update-force.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Force } from './entities/force.entity';

@Injectable()
export class ForcesService {
  constructor(
    @InjectRepository(Force)
    private forceRepository: Repository<Force>,
  ) {}

  async create(createForceDto: CreateForceDto): Promise<Force> {
    const existingForce = await this.forceRepository.findOneBy({
      name: createForceDto.name,
    });

    if (existingForce) {
      throw new ConflictException('Força policial com este nome já existe');
    }

    const force = this.forceRepository.create(createForceDto);
    return this.forceRepository.save(force);
  }

  async findAll(): Promise<Force[]> {
    return this.forceRepository.find({
      relations: ['users'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Force> {
    const force = await this.forceRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!force) {
      throw new NotFoundException(`Força policial com ID ${id} não encontrada`);
    }

    return force;
  }

  async update(id: number, updateForceDto: UpdateForceDto): Promise<Force> {
    if (updateForceDto.name) {
      const existingForce = await this.forceRepository.findOneBy({
        name: updateForceDto.name,
      });

      if (existingForce && existingForce.id !== id) {
        throw new ConflictException('Força policial com este nome já existe');
      }
    }

    const force = await this.forceRepository.preload({
      id,
      ...updateForceDto,
    });

    if (!force) {
      throw new NotFoundException(`Força policial com ID ${id} não encontrada`);
    }

    return this.forceRepository.save(force);
  }

  async remove(id: number): Promise<void> {
    const force = await this.forceRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!force) {
      throw new NotFoundException(`Força policial com ID ${id} não encontrada`);
    }

    if (force.users && force.users.length > 0) {
      throw new ConflictException(
        'Não é possível remover uma força policial que possui usuários associados',
      );
    }

    await this.forceRepository.remove(force);
  }
}
