#!/usr/bin/env ts-node

// IMPORTANTE: Carregar .env ANTES de qualquer outra importação
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

// Agora importar os módulos que dependem das variáveis de ambiente
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/typeorm.config';
import { User, UserRole } from '../users/entities/user.entity';

/**
 * Script CLI para criar ou atualizar usuários admin
 *
 * Uso:
 * pnpm admin:create --email <email> --name <nome> [--password <senha>] [--role <role>]
 *
 * Parâmetros:
 * --email: Email do usuário (obrigatório)
 * --name: Nome completo do usuário (obrigatório)
 * --password: Senha do usuário (opcional, gera senha de 6 dígitos se não informado)
 * --role: Role do usuário (opcional, padrão: admin_geral)
 *         Opções: admin_geral, ponto_focal, gestor, usuario
 * --force-id: ID da força policial (opcional, apenas para roles não admin_geral)
 * --update: Atualiza usuário existente se já existir (opcional)
 *
 * Exemplos:
 * pnpm admin:create --email admin@test.com --name "Admin Teste"
 * pnpm admin:create --email admin@test.com --name "Admin Teste" --password 123456
 * pnpm admin:create --email gestor@pf.gov.br --name "Gestor PF" --role gestor --force-id 1
 * pnpm admin:create --email admin@test.com --name "Admin Atualizado" --update
 */

interface AdminConfig {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  forceId?: number;
  update: boolean;
}

/**
 * Parse argumentos da linha de comando
 */
function parseArgs(): AdminConfig {
  const args = process.argv.slice(2);
  const config: Partial<AdminConfig> = {
    role: UserRole.ADMIN_GERAL,
    update: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--email':
        config.email = nextArg;
        i++;
        break;
      case '--name':
        config.name = nextArg;
        i++;
        break;
      case '--password':
        config.password = nextArg;
        i++;
        break;
      case '--role':
        const role = nextArg as UserRole;
        if (!Object.values(UserRole).includes(role)) {
          console.error(`❌ Role inválida: ${nextArg}`);
          console.error(
            `Opções válidas: ${Object.values(UserRole).join(', ')}`,
          );
          process.exit(1);
        }
        config.role = role;
        i++;
        break;
      case '--force-id':
        config.forceId = parseInt(nextArg, 10);
        i++;
        break;
      case '--update':
        config.update = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Parâmetro desconhecido: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }

  // Validação de parâmetros obrigatórios
  if (!config.email || !config.name) {
    console.error('❌ Parâmetros --email e --name são obrigatórios\n');
    printHelp();
    process.exit(1);
  }

  // Validação: admin_geral não pode ter força
  if (config.role === UserRole.ADMIN_GERAL && config.forceId) {
    console.error('❌ Admin geral não pode ter força policial associada');
    process.exit(1);
  }

  // Validação: outras roles precisam de força (exceto se for update)
  if (
    config.role !== UserRole.ADMIN_GERAL &&
    !config.forceId &&
    !config.update
  ) {
    console.error(`❌ Role ${config.role} requer --force-id`);
    process.exit(1);
  }

  return config as AdminConfig;
}

/**
 * Exibe ajuda do comando
 */
function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           SENTINELA - Criação de Usuários Admin               ║
╚════════════════════════════════════════════════════════════════╝

USO:
  pnpm admin:create --email <email> --name <nome> [opções]

PARÂMETROS OBRIGATÓRIOS:
  --email <email>      Email do usuário
  --name <nome>        Nome completo do usuário

PARÂMETROS OPCIONAIS:
  --password <senha>   Senha do usuário (gera senha de 6 dígitos se omitido)
  --role <role>        Role do usuário (padrão: admin_geral)
                       Opções: admin_geral, ponto_focal, gestor, usuario
  --force-id <id>      ID da força policial (obrigatório para roles não admin_geral)
  --update             Atualiza usuário existente se já existir
  --help, -h           Exibe esta ajuda

EXEMPLOS:
  # Criar admin geral com senha gerada automaticamente
  pnpm admin:create --email admin@sentinela.gov.br --name "Administrador Geral"

  # Criar admin geral com senha específica
  pnpm admin:create --email admin@sentinela.gov.br --name "Admin" --password 123456

  # Criar gestor da Polícia Federal (force_id = 1)
  pnpm admin:create --email gestor@pf.gov.br --name "Gestor PF" --role gestor --force-id 1

  # Atualizar usuário existente
  pnpm admin:create --email admin@sentinela.gov.br --name "Admin Atualizado" --update

FORÇAS POLICIAIS (IDs padrão):
  1 - Polícia Federal
  2 - Polícia Rodoviária Federal
  3 - Polícia Militar
  4 - Polícia Civil
  5 - Polícia Penal
  `);
}

/**
 * Gera uma senha numérica aleatória
 */
function generateNumericPassword(length: number = 6): string {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += Math.floor(Math.random() * 10).toString();
  }
  return password;
}

/**
 * Função principal
 */
async function main() {
  console.log(
    '\n╔════════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║           SENTINELA - Criação de Usuários Admin               ║',
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝\n',
  );
  console.log(`📄 Carregando configuração de: ${envFile}\n`);

  const config = parseArgs();

  // Inicializar conexão com o banco de dados
  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conexão estabelecida\n');

    const userRepository = dataSource.getRepository(User);

    // Verificar se usuário já existe
    const existingUser = await userRepository.findOne({
      where: { email: config.email },
    });

    if (existingUser && !config.update) {
      console.error(`❌ Usuário com email ${config.email} já existe!`);
      console.error('   Use --update para atualizar o usuário existente\n');
      process.exit(1);
    }

    // Gerar ou usar senha fornecida
    const plainPassword = config.password || generateNumericPassword(6);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    if (existingUser && config.update) {
      // Atualizar usuário existente
      console.log('🔄 Atualizando usuário existente...\n');

      existingUser.name = config.name;
      existingUser.password = hashedPassword;
      existingUser.role = config.role;
      existingUser.forceId = config.forceId;
      existingUser.mustChangePassword = true;

      await userRepository.save(existingUser);

      console.log('═'.repeat(60));
      console.log('✅ USUÁRIO ATUALIZADO COM SUCESSO');
      console.log('═'.repeat(60));
      console.log(`ID:         ${existingUser.id}`);
      console.log(`Nome:       ${existingUser.name}`);
      console.log(`Email:      ${existingUser.email}`);
      console.log(`Role:       ${existingUser.role}`);
      console.log(`Força ID:   ${existingUser.forceId || 'N/A (admin_geral)'}`);
      if (!config.password) {
        console.log(`Senha:      ${plainPassword} (gerada automaticamente)`);
      } else {
        console.log(`Senha:      ${plainPassword}`);
      }
      console.log('═'.repeat(60));
      console.log(
        '⚠️  ATENÇÃO: Usuário deve alterar a senha no primeiro login!',
      );
      console.log('═'.repeat(60));
    } else {
      // Criar novo usuário
      console.log('➕ Criando novo usuário...\n');

      const newUser = userRepository.create({
        name: config.name,
        email: config.email,
        password: hashedPassword,
        role: config.role,
        forceId: config.forceId,
        isActive: true,
        mustChangePassword: true,
      });

      await userRepository.save(newUser);

      console.log('═'.repeat(60));
      console.log('✅ USUÁRIO CRIADO COM SUCESSO');
      console.log('═'.repeat(60));
      console.log(`ID:         ${newUser.id}`);
      console.log(`Nome:       ${newUser.name}`);
      console.log(`Email:      ${newUser.email}`);
      console.log(`Role:       ${newUser.role}`);
      console.log(`Força ID:   ${newUser.forceId || 'N/A (admin_geral)'}`);
      if (!config.password) {
        console.log(`Senha:      ${plainPassword} (gerada automaticamente)`);
      } else {
        console.log(`Senha:      ${plainPassword}`);
      }
      console.log('═'.repeat(60));
      console.log(
        '⚠️  ATENÇÃO: Usuário deve alterar a senha no primeiro login!',
      );
      console.log('═'.repeat(60));
    }

    console.log('');
  } catch (error) {
    console.error('\n❌ Erro ao criar/atualizar usuário:');
    console.error(error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Executar script
main();
