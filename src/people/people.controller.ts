import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { QueryPersonDto } from './dto/query-person.dto';
import { SearchByFaceDto } from './dto/search-by-face.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Audit } from '../audit/decorators/audit.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(RolesGuard)
@Roles(
  UserRole.ADMIN_GERAL,
  UserRole.GESTOR,
  UserRole.PONTO_FOCAL,
  UserRole.USUARIO,
)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @Audit('person.create', 'Person')
  create(@Body() createPersonDto: CreatePersonDto, @CurrentUser() user: User) {
    return this.peopleService.create(createPersonDto, user.id);
  }

  @Post('search-by-face')
  @Audit('person.search_by_face', 'Person')
  @UseInterceptors(FileInterceptor('image'))
  searchByFace(
    @UploadedFile() file: Express.Multer.File,
    @Body() searchDto: SearchByFaceDto,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A imagem é obrigatória. Envie o arquivo no campo "image"',
      );
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato de imagem inválido. Formatos aceitos: JPEG, JPG, PNG',
      );
    }

    return this.peopleService.searchByFace(file.buffer, searchDto, user);
  }

  @Get()
  findAll(@Query() query: QueryPersonDto, @CurrentUser() user: User) {
    return this.peopleService.findAll(query, user);
  }

  @Get('cpf/:cpf')
  findByCpf(@Param('cpf') cpf: string) {
    return this.peopleService.findByCpf(cpf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.peopleService.findOne(+id, user);
  }

  @Patch(':id')
  @Audit('person.update', 'Person')
  update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @CurrentUser() user: User,
  ) {
    return this.peopleService.update(+id, updatePersonDto, user.id);
  }

  @Delete(':id')
  @Audit('person.delete', 'Person')
  remove(@Param('id') id: string) {
    return this.peopleService.remove(+id);
  }
}
