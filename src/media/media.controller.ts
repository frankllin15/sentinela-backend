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
  ParseIntPipe,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('media')
@UseGuards(RolesGuard)
@Roles(
  UserRole.ADMIN_GERAL,
  UserRole.GESTOR,
  UserRole.PONTO_FOCAL,
  UserRole.USUARIO,
)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Audit('media.create', 'Media')
  create(@Body() createMediaDto: CreateMediaDto, @CurrentUser() user: User) {
    return this.mediaService.create(createMediaDto, user);
  }

  @Get()
  findAll(@Query() query: QueryMediaDto, @CurrentUser() user: User) {
    return this.mediaService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.mediaService.findOne(id, user);
  }

  @Patch(':id')
  @Audit('media.update', 'Media')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMediaDto: UpdateMediaDto,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.update(id, updateMediaDto, user);
  }

  @Delete(':id')
  @Audit('media.delete', 'Media')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.mediaService.remove(id, user);
  }
}
