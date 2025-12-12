import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { QueryPersonDto } from './dto/query-person.dto';
import { Person } from './entities/person.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
  ) {}

  async create(
    createPersonDto: CreatePersonDto,
    userId: number,
  ): Promise<Person> {
    // Validar CPF duplicado
    await this.validateCpfUniqueness(createPersonDto.cpf);

    const person = this.personRepository.create({
      ...createPersonDto,
      createdBy: userId,
      isConfidential: createPersonDto.isConfidential ?? false,
    });

    return this.personRepository.save(person);
  }

  async findAll(
    queryDto: QueryPersonDto,
    user: User,
  ): Promise<{
    data: Person[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.personRepository.createQueryBuilder('person');

    // Aplicar filtro de confidencialidade
    this.applyConfidentialityFilter(queryBuilder, user);

    // Aplicar filtros de busca
    if (queryDto.fullName) {
      queryBuilder.andWhere('person.fullName ILIKE :fullName', {
        fullName: `%${queryDto.fullName}%`,
      });
    }

    if (queryDto.nickname) {
      queryBuilder.andWhere('person.nickname ILIKE :nickname', {
        nickname: `%${queryDto.nickname}%`,
      });
    }

    if (queryDto.cpf) {
      queryBuilder.andWhere('person.cpf = :cpf', { cpf: queryDto.cpf });
    }

    if (queryDto.motherName) {
      queryBuilder.andWhere('person.motherName ILIKE :motherName', {
        motherName: `%${queryDto.motherName}%`,
      });
    }

    if (queryDto.fatherName) {
      queryBuilder.andWhere('person.fatherName ILIKE :fatherName', {
        fatherName: `%${queryDto.fatherName}%`,
      });
    }

    if (queryDto.isConfidential !== undefined) {
      queryBuilder.andWhere('person.isConfidential = :isConfidential', {
        isConfidential: queryDto.isConfidential,
      });
    }

    if (queryDto.createdBy) {
      queryBuilder.andWhere('person.createdBy = :createdBy', {
        createdBy: queryDto.createdBy,
      });
    }

    // Ordenar por data de criação (mais recentes primeiro)
    queryBuilder.orderBy('person.createdAt', 'DESC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, user: User): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'updatedByUser'],
    });

    if (!person) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada`);
    }

    // Verificar acesso a registro confidencial
    this.checkConfidentialAccess(person, user);

    return person;
  }

  async update(
    id: number,
    updatePersonDto: UpdatePersonDto,
    userId: number,
  ): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { id } });

    if (!person) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada`);
    }

    // Validar CPF duplicado (excluindo o registro atual)
    if (updatePersonDto.cpf && updatePersonDto.cpf !== person.cpf) {
      await this.validateCpfUniqueness(updatePersonDto.cpf, id);
    }

    // Atualizar dados
    Object.assign(person, updatePersonDto);
    person.updatedBy = userId;

    return this.personRepository.save(person);
  }

  async remove(id: number): Promise<void> {
    const person = await this.personRepository.findOne({ where: { id } });

    if (!person) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada`);
    }

    await this.personRepository.remove(person);
  }

  async findByCpf(cpf: string): Promise<Person | null> {
    if (!cpf) return null;

    return this.personRepository.findOne({ where: { cpf } });
  }

  // Métodos auxiliares privados

  private async validateCpfUniqueness(
    cpf: string | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (!cpf) return; // CPF é opcional

    const existing = await this.personRepository.findOne({ where: { cpf } });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('CPF já cadastrado no sistema');
    }
  }

  private applyConfidentialityFilter(queryBuilder: any, user: User): void {
    // Se não for admin/gestor/ponto_focal, só mostra registros não confidenciais
    const allowedRoles = [
      UserRole.ADMIN_GERAL,
      UserRole.GESTOR,
      UserRole.PONTO_FOCAL,
    ];

    if (!allowedRoles.includes(user.role)) {
      queryBuilder.andWhere('person.isConfidential = :isConf', {
        isConf: false,
      });
    }
  }

  private checkConfidentialAccess(person: Person, user: User): void {
    if (!person.isConfidential) return; // Não é confidencial, todos podem ver

    const allowedRoles = [
      UserRole.ADMIN_GERAL,
      UserRole.GESTOR,
      UserRole.PONTO_FOCAL,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este registro confidencial',
      );
    }
  }
}
