import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { QueryPersonDto } from './dto/query-person.dto';
import { SearchByFaceDto } from './dto/search-by-face.dto';
import { FaceSearchResultDto } from './dto/face-search-result.dto';
import { Person } from './entities/person.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { ReadPersonDto } from './dto/read-person.dto';
import { PaginatedResponse } from '../common/dto';
import { PaginationService } from '../common/services/pagination.service';
import { FaceRecognitionService } from '../media/services/face-recognition.service';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private paginationService: PaginationService,
    private faceRecognitionService: FaceRecognitionService,
  ) {}

  async create(
    createPersonDto: CreatePersonDto,
    userId: number,
  ): Promise<Person> {
    // Validar CPF duplicado
    await this.validateCpfUniqueness(createPersonDto.cpf);

    // Validar Nome + Nome da Mãe duplicado
    await this.validateNameMotherNameUniqueness(
      createPersonDto.fullName,
      createPersonDto.motherName,
    );

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
  ): Promise<PaginatedResponse<ReadPersonDto>> {
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
      const cleanCpf = queryDto.cpf.replace(/\D/g, ''); // Remover formatação

      queryBuilder.andWhere('person.cpf LIKE :cpf', { cpf: `%${cleanCpf}%` });
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

    if (queryDto.isMyRecords) {
      queryBuilder.andWhere('person.createdBy = :userId', { userId: user.id });
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

    queryBuilder
      .leftJoin('person.photos', 'photos', 'photos.type = :mediaType', {
        mediaType: 'FACE',
      })
      .addSelect(['photos.url']) // Seleciona apenas a URL
      .skip(skip)
      .take(limit);

    const [people, total] = await queryBuilder.getManyAndCount();

    const data: ReadPersonDto[] = people.map(({ photos, ...person }) => {
      const readDto = new ReadPersonDto();
      Object.assign(readDto, person);
      if (photos && photos.length > 0) {
        readDto.facePhotoUrl = photos[0].url;
      }
      return readDto;
    });

    return this.paginationService.paginate(data, total, page, limit);
  }

  async findOne(id: number, user: User): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'updatedByUser'],
    });

    if (!person) {
      throw BusinessException.notFound('Pessoa', id);
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
      throw BusinessException.notFound('Pessoa', id);
    }

    // Validar CPF duplicado (excluindo o registro atual)
    if (updatePersonDto.cpf && updatePersonDto.cpf !== person.cpf) {
      await this.validateCpfUniqueness(updatePersonDto.cpf, id);
    }

    // Validar Nome + Nome da Mãe duplicado (excluindo o registro atual)
    const fullNameChanged =
      updatePersonDto.fullName && updatePersonDto.fullName !== person.fullName;
    const motherNameChanged =
      updatePersonDto.motherName !== undefined &&
      updatePersonDto.motherName !== person.motherName;

    if (fullNameChanged || motherNameChanged) {
      await this.validateNameMotherNameUniqueness(
        updatePersonDto.fullName || person.fullName,
        updatePersonDto.motherName !== undefined
          ? updatePersonDto.motherName
          : person.motherName,
        id,
      );
    }

    // Atualizar dados
    Object.assign(person, updatePersonDto);
    person.updatedBy = userId;

    return this.personRepository.save(person);
  }

  async remove(id: number): Promise<void> {
    const person = await this.personRepository.findOne({ where: { id } });

    if (!person) {
      throw BusinessException.notFound('Pessoa', id);
    }

    await this.personRepository.remove(person);
  }

  async findByCpf(cpf: string): Promise<Person | null> {
    if (!cpf) return null;

    return this.personRepository.findOne({ where: { cpf } });
  }

  /**
   * Busca pessoas por similaridade facial
   * @param imageBuffer Buffer da imagem enviada
   * @param searchDto DTO contendo parâmetros de busca
   * @param user Usuário autenticado
   * @returns Array de pessoas ordenadas por similaridade
   */
  async searchByFace(
    imageBuffer: Buffer,
    searchDto: SearchByFaceDto,
    user: User,
  ): Promise<FaceSearchResultDto[]> {
    this.logger.log(
      `Iniciando busca facial (imagem: ${imageBuffer.length} bytes)`,
    );

    // 1. Extrair embedding da imagem de busca
    const queryEmbedding =
      await this.faceRecognitionService.extractEmbeddingFromBuffer(imageBuffer);

    if (!queryEmbedding) {
      throw BusinessException.badRequest(
        'Não foi possível extrair características faciais da imagem fornecida. Verifique se a imagem contém um rosto visível.',
      );
    }

    this.logger.log(
      `Embedding extraído (dimensão: ${queryEmbedding.length}), iniciando busca no banco...`,
    );

    // 2. Buscar pessoas com embeddings similares usando pgvector
    // Operador <=> calcula distância de cosseno (quanto menor, mais similar)
    // Convertemos para similaridade: 1 - distância
    const limit = searchDto.limit || 10;
    const threshold = searchDto.threshold || 0.5;

    // Query de diagnóstico: verificar todos os candidatos sem threshold

    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (p.id)
          p.*,
          m.url as "facePhotoUrl",
          (1 - (m.embedding <=> $1::vector)) as similarity,
          (m.embedding <=> $1::vector) as distance
        FROM people p
        INNER JOIN media m ON m.person_id = p.id
        WHERE m.type = 'FACE'
          AND m.embedding IS NOT NULL
          AND (1 - (m.embedding <=> $1::vector)) >= $2
          ${this.getConfidentialityFilterSql(user)}
        ORDER BY p.id, m.embedding <=> $1::vector ASC
      ) subquery
      ORDER BY distance ASC
      LIMIT $3
    `;

    this.logger.debug(`Executando query de busca facial: ${query}`);
    this.logger.debug(`Parâmetros: threshold: ${threshold}, limit: ${limit}`);
    this.logger.debug(
      `Embedding de consulta: ${JSON.stringify(queryEmbedding)}`,
    );

    const results = await this.personRepository.query(query, [
      JSON.stringify(queryEmbedding),
      threshold,
      limit,
    ]);

    this.logger.log(
      `Busca concluída: ${results.length} resultado(s) encontrado(s) (threshold: ${threshold})`,
    );

    // 3. Mapear resultados para DTO
    return results.map((row: any) => {
      const person = new Person();
      Object.assign(person, {
        id: row.id,
        fullName: row.full_name,
        nickname: row.nickname,
        cpf: row.cpf,
        motherName: row.mother_name,
        fatherName: row.father_name,
        birthDate: row.birth_date,
        isConfidential: row.is_confidential,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });

      return {
        person,
        similarity: parseFloat(row.similarity),
        distance: parseFloat(row.distance),
        facePhotoUrl: row.facePhotoUrl,
      };
    });
  }

  // Métodos auxiliares privados

  private async validateCpfUniqueness(
    cpf: string | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (!cpf) return; // CPF é opcional

    const existing = await this.personRepository.findOne({ where: { cpf } });

    if (existing && existing.id !== excludeId) {
      throw new BusinessException(
        'CPF já cadastrado no sistema',
        'CPF_ALREADY_EXISTS',
        409,
      );
    }
  }

  private async validateNameMotherNameUniqueness(
    fullName: string,
    motherName: string | null | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (!fullName) return; // Nome completo é obrigatório, mas validar por segurança

    // Se não houver nome da mãe, não fazemos essa validação
    // pois nome sozinho não é suficiente para identificar duplicidade
    if (!motherName) return;

    // Buscar pessoa com mesma combinação de nome + nome da mãe (case-insensitive)
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .where('LOWER(person.fullName) = LOWER(:fullName)', { fullName })
      .andWhere('LOWER(person.motherName) = LOWER(:motherName)', {
        motherName,
      });

    if (excludeId) {
      queryBuilder.andWhere('person.id != :excludeId', { excludeId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BusinessException(
        'Já existe uma pessoa cadastrada com este nome completo e nome da mãe',
        'NAME_MOTHER_NAME_ALREADY_EXISTS',
        409,
      );
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
      throw BusinessException.forbidden(
        'Você não tem permissão para acessar este registro confidencial',
      );
    }
  }

  /**
   * Retorna filtro SQL para confidencialidade
   * Usado em queries raw SQL
   */
  private getConfidentialityFilterSql(user: User): string {
    const allowedRoles = [
      UserRole.ADMIN_GERAL,
      UserRole.GESTOR,
      UserRole.PONTO_FOCAL,
    ];

    if (!allowedRoles.includes(user.role)) {
      return 'AND p.is_confidential = false';
    }

    return '';
  }
}
