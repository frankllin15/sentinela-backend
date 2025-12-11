import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe');
    }

    // Validar que usuários não admin_geral devem ter forceId
    if (createUserDto.role !== UserRole.ADMIN_GERAL && !createUserDto.forceId) {
      throw new BadRequestException(
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

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
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
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    // Verificar email duplicado
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.findOneBy({
        email: updateUserDto.email,
      });

      if (emailExists) {
        throw new ConflictException('Este email já está em uso');
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
      throw new BadRequestException(
        'Usuários que não são admin_geral devem estar associados a uma força policial',
      );
    }

    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    // Soft delete: apenas marca como inativo
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['force'],
    });
  }
}
