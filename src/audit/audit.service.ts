import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuditDto } from './dto/create-audit.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditLog, AuditStatus } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(createAuditDto: CreateAuditDto): Promise<AuditLog> {
    const auditLog = this.auditRepository.create({
      ...createAuditDto,
      status: createAuditDto.status || AuditStatus.SUCCESS,
    });

    return this.auditRepository.save(auditLog);
  }

  async findAll(queryDto: QueryAuditDto): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    // Aplicar filtros
    if (queryDto.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: queryDto.userId,
      });
    }

    if (queryDto.action) {
      queryBuilder.andWhere('audit.action ILIKE :action', {
        action: `%${queryDto.action}%`,
      });
    }

    if (queryDto.targetEntity) {
      queryBuilder.andWhere('audit.targetEntity = :targetEntity', {
        targetEntity: queryDto.targetEntity,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('audit.status = :status', {
        status: queryDto.status,
      });
    }

    if (queryDto.startDate) {
      queryBuilder.andWhere('audit.timestamp >= :startDate', {
        startDate: new Date(queryDto.startDate),
      });
    }

    if (queryDto.endDate) {
      queryBuilder.andWhere('audit.timestamp <= :endDate', {
        endDate: new Date(queryDto.endDate),
      });
    }

    // Ordenar por timestamp decrescente (mais recentes primeiro)
    queryBuilder.orderBy('audit.timestamp', 'DESC');

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

  async findOne(id: number): Promise<AuditLog> {
    const auditLog = await this.auditRepository.findOne({ where: { id } });

    if (!auditLog) {
      throw new NotFoundException(
        `Log de auditoria com ID ${id} não encontrado`,
      );
    }

    return auditLog;
  }

  async findByUser(
    userId: number,
    queryDto: QueryAuditDto,
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...queryDto, userId });
  }

  async findByEntity(
    entity: string,
    queryDto: QueryAuditDto,
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...queryDto, targetEntity: entity });
  }
}
