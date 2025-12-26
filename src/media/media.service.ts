import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { Media } from './entities/media.entity';
import { PeopleService } from '../people/people.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Person } from '../people/entities/person.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { PaginatedResponse } from '../common/dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly peopleService: PeopleService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createMediaDto: CreateMediaDto, user: User): Promise<Media> {
    // Validar se Person existe e se user tem acesso (verificação de confidencialidade)
    await this.checkAccessToPerson(createMediaDto.personId, user);

    const media = this.mediaRepository.create(createMediaDto);
    return this.mediaRepository.save(media);
  }

  async findAll(
    query: QueryMediaDto,
    user: User,
  ): Promise<PaginatedResponse<Media>> {
    const { type, personId, page = 1, limit = 10 } = query;

    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.person', 'person');

    // Filtrar por tipo se fornecido
    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    // Filtrar por personId se fornecido
    if (personId) {
      queryBuilder.andWhere('media.personId = :personId', { personId });
    }

    // Aplicar filtro de confidencialidade
    // Se user não é ADMIN_GERAL, GESTOR ou PONTO_FOCAL, só retornar mídias de pessoas não confidenciais
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

    // Paginação
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Ordenar por data de criação (mais recente primeiro)
    queryBuilder.orderBy('media.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return this.paginationService.paginate(data, total, page, limit);
  }

  async findOne(id: number, user: User): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ['person'],
    });

    if (!media) {
      throw BusinessException.notFound('Mídia', id);
    }

    // Verificar se user tem acesso à Person associada (confidencialidade)
    try {
      await this.peopleService.findOne(media.personId, user);
    } catch (error) {
      if (
        error instanceof BusinessException &&
        error.statusCode.valueOf() === 403
      ) {
        throw BusinessException.forbidden(
          'Você não tem permissão para acessar esta mídia',
        );
      }
      throw error;
    }

    return media;
  }

  async findByPerson(personId: number, user: User): Promise<Media[]> {
    // Verificar se Person existe e se user tem acesso
    await this.checkAccessToPerson(personId, user);

    return this.mediaRepository.find({
      where: { personId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateMediaDto: UpdateMediaDto,
    user: User,
  ): Promise<Media> {
    const media = await this.findOne(id, user);

    // Verificar acesso à Person associada (já feito em findOne)
    // Se personId está sendo mudado, validar acesso à nova Person
    if (updateMediaDto.personId && updateMediaDto.personId !== media.personId) {
      await this.checkAccessToPerson(updateMediaDto.personId, user);
    }

    Object.assign(media, updateMediaDto);
    return this.mediaRepository.save(media);
  }

  async remove(id: number, user: User): Promise<void> {
    const media = await this.findOne(id, user);
    await this.mediaRepository.remove(media);
  }

  /**
   * Método auxiliar para verificar se user tem acesso à Person
   * Lança exceção se Person não existe ou se user não tem permissão
   */
  private async checkAccessToPerson(
    personId: number,
    user: User,
  ): Promise<Person> {
    try {
      return await this.peopleService.findOne(personId, user);
    } catch (error) {
      if (
        error instanceof BusinessException &&
        error.statusCode.valueOf() === 403
      ) {
        throw BusinessException.forbidden(
          'Você não tem permissão para acessar registros desta pessoa',
        );
      }
      throw error;
    }
  }
}
