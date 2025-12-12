import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN_GERAL)
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN_GERAL)
  findByUser(@Param('userId') userId: string, @Query() query: QueryAuditDto) {
    return this.auditService.findByUser(+userId, query);
  }

  @Get('entity/:entity')
  @Roles(UserRole.ADMIN_GERAL)
  findByEntity(@Param('entity') entity: string, @Query() query: QueryAuditDto) {
    return this.auditService.findByEntity(entity, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_GERAL)
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(+id);
  }
}
