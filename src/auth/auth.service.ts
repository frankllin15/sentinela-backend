import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuditService } from '../audit/audit.service';
import { AuditStatus } from '../audit/entities/audit.entity';
import { BusinessException } from '../common/exceptions/business.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  /**
   * Valida credenciais do usuário
   * @param email Email do usuário
   * @param password Senha em texto plano
   * @param ipAddress IP do usuário (opcional)
   * @returns Usuário se válido, null caso contrário
   */
  async validateUser(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['force'],
    });

    if (!user) {
      // Registrar falha de login - usuário não encontrado
      await this.auditService.log({
        action: 'auth.login.failed',
        targetEntity: 'User',
        userId: null,
        ipAddress,
        status: AuditStatus.FAILURE,
        details: { email, reason: 'Usuário não encontrado' },
      });
      return null;
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      // Registrar falha de login - usuário inativo
      await this.auditService.log({
        action: 'auth.login.failed',
        targetEntity: 'User',
        userId: user.id,
        ipAddress,
        status: AuditStatus.FAILURE,
        details: { email, reason: 'Usuário desativado' },
      });
      throw BusinessException.unauthorized('Usuário desativado');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Registrar falha de login - senha inválida
      await this.auditService.log({
        action: 'auth.login.failed',
        targetEntity: 'User',
        userId: user.id,
        ipAddress,
        status: AuditStatus.FAILURE,
        details: { email, reason: 'Senha inválida' },
      });
      return null;
    }

    return user;
  }

  /**
   * Realiza login e gera token JWT
   * @param user Usuário autenticado
   * @param ipAddress IP do usuário (opcional)
   * @returns Token JWT e dados do usuário
   */
  async login(user: User, ipAddress?: string): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      forceId: user.forceId,
    };

    // Registrar sucesso do login
    await this.auditService.log({
      action: 'auth.login.success',
      targetEntity: 'User',
      userId: user.id,
      ipAddress,
      status: AuditStatus.SUCCESS,
      details: { email: user.email, role: user.role },
    });

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forceId: user.forceId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  /**
   * Busca usuário por ID
   * @param userId ID do usuário
   * @returns Usuário encontrado
   */
  async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['force'],
    });

    if (!user) {
      throw BusinessException.unauthorized('Usuário não encontrado');
    }

    return user;
  }

  async getUserProfile(userId: number): Promise<UserProfileDto | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['force'],
      select: ['id', 'email', 'role', 'forceId', 'mustChangePassword'],
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      forceId: user.forceId,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
