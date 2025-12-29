import * as Joi from 'joi';

export const envSchema = Joi.object({
  // --- Application ---
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // --- Database (Postgres) ---
  // DATABASE_URL tem prioridade sobre campos individuais
  DATABASE_URL: Joi.string().uri().optional(),

  DB_TYPE: Joi.string().valid('postgres').default('postgres'),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_DATABASE: Joi.string().optional(),

  // --- TypeORM Settings ---
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_AUTO_LOAD_ENTITIES: Joi.boolean().default(true),

  // --- JWT Authentication ---
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('24h'),

  // --- Cloudflare R2 ---
  R2_ACCOUNT_ID: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_URL: Joi.string().uri().required(),
})
  .or('DATABASE_URL', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE')
  .messages({
    'object.missing':
      'Deve fornecer DATABASE_URL ou campos individuais (DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE)',
  });
