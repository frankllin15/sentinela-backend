import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ForcesService } from './forces.service';
import { CreateForceDto } from './dto/create-force.dto';
import { UpdateForceDto } from './dto/update-force.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('forces')
export class ForcesController {
  constructor(private readonly forcesService: ForcesService) {}

  @Post()
  @Roles(UserRole.ADMIN_GERAL)
  create(@Body() createForceDto: CreateForceDto) {
    return this.forcesService.create(createForceDto);
  }

  @Get()
  @Roles(UserRole.ADMIN_GERAL, UserRole.PONTO_FOCAL, UserRole.GESTOR)
  findAll() {
    return this.forcesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_GERAL, UserRole.PONTO_FOCAL, UserRole.GESTOR)
  findOne(@Param('id') id: string) {
    return this.forcesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN_GERAL)
  update(@Param('id') id: string, @Body() updateForceDto: UpdateForceDto) {
    return this.forcesService.update(+id, updateForceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_GERAL)
  remove(@Param('id') id: string) {
    return this.forcesService.remove(+id);
  }
}
