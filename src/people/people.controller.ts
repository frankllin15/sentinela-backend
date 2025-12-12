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
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { QueryPersonDto } from './dto/query-person.dto';
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
