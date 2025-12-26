import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { BusinessException } from '../common/exceptions/business.exception';
import { PaginatedResponse } from '../common/dto';
import { PaginationService } from '../common/services/pagination.service';
import { ReadUserDto } from './dto/read-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private paginationService: PaginationService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw BusinessException.alreadyExists('Usuário', 'email');
    }

    // Validar que usuários não admin_geral devem ter forceId
    if (createUserDto.role !== UserRole.ADMIN_GERAL && !createUserDto.forceId) {
      throw BusinessException.invalidOperation(
        'Usuários que não são admin_geral devem estar associados a uma força policial',
      );
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      mustChangePassword: true,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    queryUserDto: QueryUserDto,
  ): Promise<PaginatedResponse<ReadUserDto>> {
    const { page = 1, limit = 20, isActive, forceId } = queryUserDto;

    // Construir filtros dinâmicos
    const where: any = {};

    // Filtrar por isActive (se fornecido)
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtrar por forceId (se fornecido)
    if (forceId !== undefined) {
      where.forceId = forceId;
    }

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Buscar dados e contagem total
    const [data, total] = await this.userRepository.findAndCount({
      where,
      relations: ['force'],
      select: {
        id: true,
        email: true,
        role: true,
        forceId: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        force: {
          name: true,
        },
      },
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    const userData: ReadUserDto[] = data.map(({ force, ...user }) => ({
      ...user,
      forceName: force?.name,
    }));

    return this.paginationService.paginate(userData, total, page, limit);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['force'],
      select: [
        'id',
        'email',
        'role',
        'forceId',
        'isActive',
        'mustChangePassword',
        'createdAt',
      ],
    });

    if (!user) {
      throw BusinessException.notFound('Usuário', id);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { id },
    });

    if (!existingUser) {
      throw BusinessException.notFound('Usuário', id);
    }

    // Verificar email duplicado
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.findOneBy({
        email: updateUserDto.email,
      });

      if (emailExists) {
        throw BusinessException.alreadyExists('Usuário', 'email');
      }
    }

    // Se está atualizando a senha, fazer hash
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Validar que usuários não admin_geral devem ter forceId
    const newRole = updateUserDto.role ?? existingUser.role;
    const newForceId = updateUserDto.forceId ?? existingUser.forceId;

    if (newRole !== UserRole.ADMIN_GERAL && !newForceId) {
      throw BusinessException.invalidOperation(
        'Usuários que não são admin_geral devem estar associados a uma força policial',
      );
    }

    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw BusinessException.notFound('Usuário', id);
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw BusinessException.notFound('Usuário', id);
    }

    await this.userRepository.remove(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['force'],
    });
  }
}
