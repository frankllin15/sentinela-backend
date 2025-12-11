import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ForcesService } from './forces.service';
import { CreateForceDto } from './dto/create-force.dto';
import { UpdateForceDto } from './dto/update-force.dto';

@Controller('forces')
export class ForcesController {
  constructor(private readonly forcesService: ForcesService) {}

  @Post()
  create(@Body() createForceDto: CreateForceDto) {
    return this.forcesService.create(createForceDto);
  }

  @Get()
  findAll() {
    return this.forcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forcesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateForceDto: UpdateForceDto) {
    return this.forcesService.update(+id, updateForceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.forcesService.remove(+id);
  }
}
