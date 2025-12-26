import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PaginationService } from './services/pagination.service';

/**
 * Módulo Common
 *
 * Fornece funcionalidades compartilhadas para toda a aplicação:
 * - Tratamento global de exceções via HttpExceptionFilter
 * - DTOs e exceptions reutilizáveis
 * - PaginationService para formatação consistente de respostas paginadas
 *
 * Importado globalmente no AppModule para aplicar:
 * - Filtro de exceções em todos os endpoints
 * - Formato padronizado de respostas de erro (ErrorResponseDto)
 * - Classificação de erros user-facing vs técnicos
 * - Serviço de paginação disponível para todos os módulos
 */
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    PaginationService,
  ],
  exports: [PaginationService],
})
export class CommonModule {}
