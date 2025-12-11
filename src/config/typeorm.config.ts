import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Determinar se estamos em modo de desenvolvimento (TypeScript) ou produção (JavaScript)
const isDevelopment = __filename.endsWith('.ts');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'sentinela',
  database: process.env.DB_DATABASE || 'sentinela_db',

  // Entity discovery - usa TS em dev, JS em prod
  entities: isDevelopment
    ? [path.join(__dirname, '../**/*.entity.ts')]
    : [path.join(__dirname, '../**/*.entity.js')],

  // Migration settings
  migrations: isDevelopment
    ? [path.join(__dirname, '../database/migrations/*.ts')]
    : [path.join(__dirname, '../database/migrations/*.js')],
  migrationsTableName: 'typeorm_migrations',

  // Development/Production settings from env
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
};

// DataSource instance for CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
