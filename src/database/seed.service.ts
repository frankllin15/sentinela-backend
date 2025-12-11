import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Force } from '../forces/entities/force.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Force)
    private forceRepository: Repository<Force>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedForces();
    await this.seedAdminUser();
  }

  /**
   * Seed das 5 forças policiais brasileiras
   */
  private async seedForces(): Promise<void> {
    const forcesData = [
      'Polícia Federal',
      'Polícia Rodoviária Federal',
      'Polícia Militar',
      'Polícia Civil',
      'Polícia Penal',
    ];

    for (const forceName of forcesData) {
      const existingForce = await this.forceRepository.findOne({
        where: { name: forceName },
      });

      if (!existingForce) {
        const force = this.forceRepository.create({ name: forceName });
        await this.forceRepository.save(force);
        this.logger.log(`Força criada: ${forceName}`);
      }
    }

    this.logger.log('Seed de forças policiais concluído');
  }

  /**
   * Seed do usuário admin_geral
   * - Gera senha numérica de 6 dígitos
   * - Exibe credenciais no console apenas na criação
   */
  private async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@sentinela.gov.br';

    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN_GERAL },
    });

    if (!existingAdmin) {
      // Gerar senha numérica de 6 dígitos
      const numericPassword = this.generateNumericPassword(6);
      const hashedPassword = await bcrypt.hash(numericPassword, 10);

      const admin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN_GERAL,
        force: undefined,
        forceId: undefined,
        isActive: true,
        mustChangePassword: true,
      });

      await this.userRepository.save(admin);

      // Exibir credenciais temporárias no console
      this.logger.warn('═'.repeat(60));
      this.logger.warn('CREDENCIAIS DE ADMIN GERAL CRIADAS');
      this.logger.warn('═'.repeat(60));
      this.logger.warn(`Email: ${adminEmail}`);
      this.logger.warn(`Senha temporária: ${numericPassword}`);
      this.logger.warn('═'.repeat(60));
      this.logger.warn(
        'ATENÇÃO: Esta senha é temporária e deve ser alterada no primeiro login!',
      );
      this.logger.warn('═'.repeat(60));
    } else {
      this.logger.log('Admin geral já existe - seed não executado');
    }
  }

  /**
   * Gera uma senha numérica aleatória
   * @param length Comprimento da senha (padrão: 6)
   * @returns Senha numérica como string
   */
  private generateNumericPassword(length: number = 6): string {
    let password = '';
    for (let i = 0; i < length; i++) {
      password += Math.floor(Math.random() * 10).toString();
    }
    return password;
  }
}
