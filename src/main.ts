import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração de CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma tipos automaticamente (ex: string "123" -> number 123)
      // exceptionFactory: (errors) => {
      //   // Formata erros de validação como array de mensagens
      //   const messages = errors.map((error) =>
      //     Object.values(error.constraints || {}).join(', '),
      //   );
      //   return new BadRequestException(messages);
      // },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
