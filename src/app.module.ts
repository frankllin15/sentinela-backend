import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './config/typeorm.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ForcesModule } from './forces/forces.module';
import { AuditModule } from './audit/audit.module';
import { PeopleModule } from './people/people.module';
import { MediaModule } from './media/media.module';
import { CommonModule } from './common/common.module';
import { MediaUploadModule } from './media-upload/media-upload.module';
import r2Config from './config/r2.config';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envSchema,
      load: [r2Config],
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ForcesModule,
    AuditModule,
    PeopleModule,
    MediaModule,
    MediaUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
