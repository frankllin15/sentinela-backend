# Entidades do Sistema Sentinela

Este documento descreve as entidades do banco de dados do sistema Sentinela Backend.

## Visão Geral

O sistema possui 3 entidades principais:
- **Force** - Forças policiais
- **User** - Usuários do sistema
- **AuditLog** - Logs de auditoria

## Force (Forças Policiais)

**Tabela**: `forces`

Representa as 5 forças policiais brasileiras suportadas pelo sistema.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK, Auto-increment | Identificador único |
| `name` | varchar(100) | Unique, Not Null | Nome da força policial |

### Valores Esperados

As seguintes forças devem ser criadas via seed:
1. Polícia Federal
2. Polícia Rodoviária Federal
3. Polícia Militar
4. Polícia Civil
5. Polícia Penal

### Relacionamentos

- **OneToMany** com `User` - Uma força pode ter vários usuários

### Exemplo de Uso

```typescript
import { Force } from './forces/entities/force.entity';

// Criar uma força
const force = new Force();
force.name = 'Polícia Federal';
await forceRepository.save(force);
```

## User (Usuários)

**Tabela**: `users`

Representa os usuários do sistema com controle de acesso baseado em roles.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK, Auto-increment | Identificador único |
| `email` | varchar(255) | Unique, Not Null | Email do usuário |
| `password` | varchar(255) | Not Null | Hash bcrypt da senha |
| `role` | enum | Not Null, Default: 'usuario' | Papel do usuário |
| `force_id` | integer | FK, Nullable | ID da força policial |
| `is_active` | boolean | Default: true | Status do usuário |
| `must_change_password` | boolean | Default: true | Flag para troca obrigatória de senha |
| `created_at` | timestamp | Auto | Data de criação |

### Enum UserRole

```typescript
export enum UserRole {
  ADMIN_GERAL = 'admin_geral',    // Admin geral (sem força específica)
  PONTO_FOCAL = 'ponto_focal',    // Ponto focal de uma força
  GESTOR = 'gestor',              // Gestor de uma força
  USUARIO = 'usuario',            // Usuário comum
}
```

### Regras de Negócio

1. **Admin Geral (`admin_geral`)**:
   - Pode operar em todas as forças
   - Campo `force_id` pode ser NULL
   - Criado automaticamente no primeiro boot do sistema

2. **Outros Roles**:
   - Devem estar vinculados a uma força específica (`force_id` obrigatório)
   - Só podem acessar dados de sua força

3. **Senha Inicial**:
   - Senhas são numéricas de 6 dígitos para admins iniciais
   - Todos os hashes devem usar bcrypt
   - `must_change_password` é true por padrão

4. **Status**:
   - `is_active = false` realiza soft delete (usuário não é excluído)

### Relacionamentos

- **ManyToOne** com `Force` - Usuário pertence a uma força (nullable para admin_geral)

### Exemplo de Uso

```typescript
import { User, UserRole } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Criar um admin geral
const admin = new User();
admin.email = 'admin@sentinela.gov.br';
admin.password = await bcrypt.hash('123456', 10);
admin.role = UserRole.ADMIN_GERAL;
admin.force = null; // Admin geral não tem força específica
await userRepository.save(admin);

// Criar um usuário de força
const user = new User();
user.email = 'usuario@pf.gov.br';
user.password = await bcrypt.hash('senha123', 10);
user.role = UserRole.USUARIO;
user.forceId = 1; // Polícia Federal
await userRepository.save(user);
```

## AuditLog (Logs de Auditoria)

**Tabela**: `audit_logs`

Registra todas as ações significativas do sistema para compliance e segurança.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK, Auto-increment | Identificador único |
| `action` | varchar(255) | Not Null | Descrição da ação |
| `user_id` | integer | Nullable | ID do usuário que executou |
| `target_entity` | varchar(255) | Not Null | Entidade afetada |
| `details` | jsonb | Nullable | Detalhes da mudança (before/after) |
| `ip_address` | varchar(45) | Nullable | Endereço IP do usuário |
| `timestamp` | timestamp | Auto | Data/hora da ação |

### Tipos de Ação

Exemplos de ações que devem ser auditadas:
- `USER_CREATED` - Usuário criado
- `USER_UPDATED` - Usuário atualizado
- `USER_DELETED` - Usuário desativado
- `LOGIN_SUCCESS` - Login bem-sucedido
- `LOGIN_FAILED` - Tentativa de login falhou
- `PASSWORD_CHANGED` - Senha alterada
- `FORCE_CREATED` - Força criada
- `FORCE_UPDATED` - Força atualizada

### Campo Details (JSONB)

Estrutura sugerida para o campo `details`:

```typescript
{
  before: {
    // Estado anterior do objeto
  },
  after: {
    // Estado posterior do objeto
  },
  metadata: {
    // Informações adicionais
  }
}
```

### Exemplo de Uso

```typescript
import { AuditLog } from './audit/entities/audit.entity';

// Registrar uma ação
const log = new AuditLog();
log.action = 'USER_UPDATED';
log.userId = currentUser.id;
log.targetEntity = 'User';
log.details = {
  before: { email: 'old@email.com' },
  after: { email: 'new@email.com' },
  metadata: { field: 'email' }
};
log.ipAddress = request.ip;
await auditRepository.save(log);
```

### Boas Práticas

1. **Sempre registre**:
   - Criação, atualização e exclusão de usuários
   - Mudanças de permissões ou roles
   - Tentativas de login (sucesso e falha)
   - Mudanças de senha

2. **Capture o IP**:
   - Importante para rastreabilidade
   - Pode ser obtido via `request.ip` ou headers

3. **Details estruturados**:
   - Use JSONB para flexibilidade
   - Inclua before/after para auditoria completa
   - Não armazene senhas ou dados sensíveis

4. **Retenção**:
   - Logs de auditoria devem ser mantidos por tempo determinado
   - Implementar política de retenção conforme compliance

## Migrations

Para criar as tabelas no banco de dados:

```bash
# Gerar migration baseada nas entidades
pnpm migration:generate src/database/migrations/CreateInitialSchema

# Executar migrations
pnpm migration:run
```

## Relacionamentos Resumidos

```
Force (1) -----> (*) User
   |
   └─ One Force has Many Users
   └─ User.force can be NULL (for admin_geral)

AuditLog - Tabela independente (sem FK)
   └─ user_id armazena ID mas não é FK (usuário pode ser deletado)
```

## Índices Recomendados

Para otimizar consultas, considere criar índices em:

### Users
- `email` (já unique, automaticamente indexado)
- `role`
- `force_id`
- `is_active`

### AuditLogs
- `user_id`
- `timestamp` (DESC)
- `action`
- Índice composto: `(user_id, timestamp DESC)`

### Forces
- `name` (já unique, automaticamente indexado)

## Segurança

### Senhas
- **NUNCA** armazene senhas em texto plano
- Use bcrypt com salt rounds >= 10
- Validar força da senha no frontend e backend

### Soft Delete
- Use `is_active = false` ao invés de DELETE
- Mantém histórico de auditoria
- Permite recuperação de usuários

### Validações
- Email deve ser válido (validação no DTO)
- Role deve ser um dos valores do enum
- force_id obrigatório para roles != admin_geral
- IP address válido (IPv4 ou IPv6)

## Próximos Passos

1. Implementar Seeds:
   - Criar as 5 forças policiais
   - Criar admin geral inicial

2. Implementar Serviços:
   - CRUD para cada entidade
   - Validações de negócio
   - Interceptadores de auditoria

3. Implementar Autenticação:
   - JWT Strategy
   - Guards para roles
   - Middleware de auditoria
