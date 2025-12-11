Perfeito. A escolha pelo **NestJS** é fantástica para esse cenário. Ele traz uma arquitetura modular muito organizada (inspirada em Angular), perfeita para projetos que vão escalar (como a Fase 2 do Sentinela) e já possui integração nativa robusta com TypeScript e ORMs.

Aqui está o **Documento de Requisitos Técnicos (Prompt)** atualizado para **NestJS + TypeORM**, focado na inicialização do backend.

-----

# 📋 Prompt de Requisitos Técnicos: Backend Sentinela (Stack NestJS)

Você atuará como um Engenheiro de Software Sênior especializado em Node.js e TypeScript. Sua tarefa é implementar a **fundação do backend** do projeto **Sentinela** utilizando o framework **NestJS**.

Abaixo estão as especificações técnicas e regras de negócio para o setup inicial.

## 1\. Stack Tecnológica

  * **Runtime:** Node.js (LTS v18+).
  * **Framework:** NestJS (Standard Architecture).
  * **Linguagem:** TypeScript.
  * **Banco de Dados:** PostgreSQL 15.
  * **ORM & Migrations:** **TypeORM** (Obrigatório para gestão de schema e migrations).
  * **Infraestrutura:** Docker e Docker Compose.
  * **Autenticação:** Passport-JWT e Bcrypt.

## 2\. Estrutura Modular

O projeto deve seguir a arquitetura modular do NestJS:

```text
/src
  ├── app.module.ts        # Módulo Raiz
  ├── main.ts              # Entrypoint
  ├── config/              # Configurações (TypeORM, Env)
  ├── database/
  │   ├── migrations/      # Arquivos de migração gerados
  │   └── seeds/           # Lógica de Seed Inicial
  └── modules/
      ├── auth/            # Login e JWT Strategy
      ├── users/           # Entidade e Services de Usuário
      ├── forces/          # Entidade de Forças Policiais
      └── audit/           # Logs de Auditoria
```

## 3\. Modelagem de Dados (TypeORM Entities)

### 3.1 Entidade: `Force` (Forças Policiais)

[cite_start]Corporações permitidas no sistema [cite: 47-52].

  * `id`: PrimaryGeneratedColumn (Integer).
  * `name`: Column (String, Unique). Valores fixos esperados: "Polícia Federal", "Polícia Rodoviária Federal", "Polícia Militar", "Polícia Civil", "Polícia Penal".

### 3.2 Entidade: `User` (Usuários)

[cite_start]Controle de acesso e hierarquia [cite: 24-45].

  * `id`: PrimaryGeneratedColumn (Integer).
  * `email`: Column (String, Unique).
  * `password`: Column (String) - Hash armazenado.
  * `role`: Column (Enum ou String) - Valores: `admin_geral`, `ponto_focal`, `gestor`, `usuario`.
  * `force`: ManyToOne relation com `Force` (Nullable apenas se role for `admin_geral`).
  * `isActive`: Column (Boolean, default true).
  * [cite_start]`mustChangePassword`: Column (Boolean, default true) - Para fluxo de primeiro acesso[cite: 16].
  * `createdAt`: CreateDateColumn.

### 3.3 Entidade: `AuditLog` (Auditoria)

[cite_start]Registro de segurança [cite: 93-100].

  * `id`: PrimaryGeneratedColumn (Integer).
  * `action`: Column (String).
  * `userId`: Column (Integer, Nullable).
  * `targetEntity`: Column (String).
  * `details`: Column (JSON/Text) - Para "before/after".
  * `ipAddress`: Column (String, Nullable).
  * `timestamp`: CreateDateColumn.

## 4\. Regras de Negócio e Inicialização

### 4.1 Gestão de Banco de Dados (Migrations)

  * Não utilizar `synchronize: true` do TypeORM em produção.
  * O sistema deve estar configurado para rodar migrations via CLI (`pnpm run migration:run`) ou automaticamente no startup do Docker.

### 4.2 Seed Automático (App Initialization)

Ao iniciar a aplicação (`OnModuleInit` ou serviço de Bootstrap), o sistema deve garantir:

1.  **Forças:** As 5 forças policiais devem existir no banco.
2.  **Admin Geral:**
      * Verificar existência de usuário com role `admin_geral`.
      * Se não existir, criar automaticamente.
      * [cite_start]**Senha:** Gerar senha numérica aleatória (6 dígitos)[cite: 12].
      * [cite_start]**Log:** Exibir as credenciais temporárias no console (stdout) apenas na criação[cite: 15].

### 4.3 Autenticação

  * Validar senha numérica no cadastro/login.
  * Implementar `AuthGuard` (JWT) global ou por rota.

## 5\. Instruções para a LLM (Output Esperado)

Gere os arquivos essenciais para este setup:

1.  `docker-compose.yml`: PostgreSQL + App NestJS (dev mode).
2.  `src/config/typeorm.config.ts`: Configuração do DataSource.
3.  `src/modules/**/entities/*.entity.ts`: As 3 entidades descritas.
4.  `src/database/seeds/init.seed.ts`: Lógica do Admin e Forças.
5.  `src/main.ts`: Configuração básica.
6.  `package.json`: Scripts necessários para build e migration.