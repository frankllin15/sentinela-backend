import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Determinar se estamos em modo de desenvolvimento (TypeScript) ou produção (JavaScript)
const isDevelopment = __filename.endsWith('.ts');

/**
 * Parse DATABASE_URL connection string para extrair credenciais
 * Formato: postgresql://user:password@host:port/database
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1), // Remove leading '/'
    };
  } catch (error) {
    console.error('Erro ao parsear DATABASE_URL:', error);
    return null;
  }
}

// Parse DATABASE_URL se disponível, senão usa variáveis individuais
const databaseUrl = process.env.DATABASE_URL;
const parsedUrl = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: parsedUrl?.host || process.env.DB_HOST || 'localhost',
  port: parsedUrl?.port || parseInt(process.env.DB_PORT || '5432', 10),
  username: parsedUrl?.username || process.env.DB_USERNAME || 'root',
  password: parsedUrl?.password || process.env.DB_PASSWORD || 'sentinela',
  database: parsedUrl?.database || process.env.DB_DATABASE || 'sentinela_db',

  // SSL para produção (Render requer SSL)
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,

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
