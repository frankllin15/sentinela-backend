# Autenticação - Sistema Sentinela

Este documento descreve o sistema de autenticação JWT implementado no Sentinela Backend.

## Visão Geral

O sistema utiliza **JWT (JSON Web Tokens)** com **Passport.js** para autenticação stateless. A implementação segue os padrões do NestJS e inclui estratégias para login local e autenticação via token.

## Arquitetura

### Componentes Principais

1. **Strategies**:
   - `LocalStrategy` - Valida credenciais email/senha no login
   - `JwtStrategy` - Valida tokens JWT em requests autenticadas

2. **Guards**:
   - `LocalAuthGuard` - Protege endpoint de login
   - `JwtAuthGuard` - Protege rotas que requerem autenticação (global)
   - `RolesGuard` - Controla acesso baseado em roles

3. **Services**:
   - `AuthService` - Lógica de negócio de autenticação

4. **Controllers**:
   - `AuthController` - Endpoints de autenticação

5. **Decorators**:
   - `@Public()` - Marca rotas como públicas (sem autenticação)
   - `@Roles(...roles)` - Restringe acesso por role
   - `@CurrentUser()` - Injeta usuário autenticado no handler

## Fluxo de Autenticação

### 1. Login

```
Cliente                    AuthController              LocalStrategy              AuthService              Database
  |                              |                            |                          |                     |
  |----POST /auth/login--------->|                            |                          |                     |
  |  { email, password }         |                            |                          |                     |
  |                              |------- validate() -------->|                          |                     |
  |                              |                            |---- validateUser() ----->|                     |
  |                              |                            |                          |---- findOne() ----->|
  |                              |                            |                          |<--- User data  -----|
  |                              |                            |<--- bcrypt.compare() ----|                     |
  |                              |<---- User object ----------|                          |                     |
  |                              |---- login(user) ---------------------------------->|                          |
  |                              |<--- JWT token + user data -------------------------|                          |
  |<--- { access_token, user }---|                            |                          |                     |
```

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "admin@sentinela.gov.br",
  "password": "123456"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@sentinela.gov.br",
    "role": "admin_geral",
    "forceId": null,
    "mustChangePassword": true
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

### 2. Acesso a Rotas Protegidas

```
Cliente                    Guard (JwtAuthGuard)         JwtStrategy                AuthService              Database
  |                              |                            |                          |                     |
  |----GET /auth/profile-------->|                            |                          |                     |
  |  Header: Authorization       |                            |                          |                     |
  |  Bearer <token>              |                            |                          |                     |
  |                              |---- Extract & Validate --->|                          |                     |
  |                              |                            |---- verify JWT --------->|                     |
  |                              |<--- User payload ----------|                          |                     |
  |                              |                            |                          |                     |
  |<--- Handler executes --------|                            |                          |                     |
  |<--- User data ---------------|                            |                          |                     |
```

**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "admin@sentinela.gov.br",
  "role": "admin_geral",
  "forceId": null,
  "isActive": true,
  "mustChangePassword": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "force": null
}
```

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# JWT Authentication
JWT_SECRET=sentinela-super-secret-key-change-in-production-2024
JWT_EXPIRATION=24h
```

**Importante**:
- `JWT_SECRET`: **DEVE** ser alterado em produção (use uma string aleatória longa)
- `JWT_EXPIRATION`: Tempo de expiração do token (ex: `1h`, `7d`, `30d`)

### Gerar Secret Seguro

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

## Endpoints

### POST /auth/login

Autentica usuário e retorna token JWT.

- **Autenticação**: Não (público)
- **Body**: `{ email: string, password: string }`
- **Response**: `{ access_token: string, user: {...} }`

### GET /auth/profile

Retorna dados do usuário autenticado.

- **Autenticação**: Sim (JWT)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Dados do usuário sem a senha

## Guards

### JwtAuthGuard (Global)

Aplicado globalmente a todas as rotas. Para tornar uma rota pública, use o decorator `@Public()`.

```typescript
@Public()
@Get('health')
async healthCheck() {
  return { status: 'ok' };
}
```

### RolesGuard

Controla acesso baseado em roles do usuário.

```typescript
@Roles(UserRole.ADMIN_GERAL, UserRole.PONTO_FOCAL)
@Get('admin-only')
async adminRoute() {
  return { message: 'Acesso restrito' };
}
```

### Uso Combinado

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GERAL)
@Post('create-force')
async createForce() {
  // Apenas admin_geral pode acessar
}
```

## Decorators

### @Public()

Marca rotas como públicas (sem autenticação).

```typescript
@Public()
@Get('public-data')
async getPublicData() {
  return { data: 'Acessível sem autenticação' };
}
```

### @Roles(...roles)

Restringe acesso por roles.

```typescript
@Roles(UserRole.GESTOR, UserRole.PONTO_FOCAL)
@Get('managers-only')
async managersRoute() {
  return { message: 'Apenas gestores e pontos focais' };
}
```

### @CurrentUser()

Injeta usuário autenticado no handler.

```typescript
@Get('my-profile')
async getMyProfile(@CurrentUser() user: any) {
  return { userId: user.id, email: user.email };
}
```

## Estrutura de Arquivos

```
src/auth/
├── decorators/
│   ├── current-user.decorator.ts    # @CurrentUser()
│   ├── public.decorator.ts          # @Public()
│   └── roles.decorator.ts           # @Roles()
├── dto/
│   ├── login.dto.ts                 # DTO de login
│   ├── auth-response.dto.ts         # DTO de resposta
│   └── index.ts                     # Exports
├── guards/
│   ├── jwt-auth.guard.ts            # Guard JWT (global)
│   ├── local-auth.guard.ts          # Guard login local
│   └── roles.guard.ts               # Guard de roles
├── strategies/
│   ├── jwt.strategy.ts              # Estratégia JWT
│   └── local.strategy.ts            # Estratégia local
├── auth.controller.ts               # Controller de auth
├── auth.module.ts                   # Módulo de auth
└── auth.service.ts                  # Serviço de auth
```

## Segurança

### Validação de Credenciais

1. **Email**: Verifica se usuário existe no banco
2. **Senha**: Compara hash bcrypt (10 rounds)
3. **Status**: Verifica se `isActive === true`
4. **Token**: Assina com secret e expiration

### Proteção de Rotas

- **Global**: JwtAuthGuard aplicado em APP_GUARD
- **Public**: Rotas marcadas com `@Public()` são acessíveis
- **Roles**: RolesGuard verifica permissões do usuário

### Payload JWT

```json
{
  "sub": 1,
  "email": "admin@sentinela.gov.br",
  "role": "admin_geral",
  "forceId": null,
  "iat": 1705315800,
  "exp": 1705402200
}
```

**Campos**:
- `sub`: User ID
- `email`: Email do usuário
- `role`: Role do usuário
- `forceId`: ID da força (null para admin_geral)
- `iat`: Issued at (timestamp)
- `exp`: Expiration (timestamp)

### Boas Práticas Implementadas

✅ Senhas nunca retornadas nas respostas
✅ Hash bcrypt com 10 rounds
✅ Tokens com expiração configurável
✅ Validação de usuário ativo
✅ Verificação de credenciais antes de gerar token
✅ Guards aplicados globalmente
✅ Decorators para casos de exceção

## Testando a Autenticação

### Com cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sentinela.gov.br","password":"123456"}'

# Response:
# {
#   "access_token": "eyJhbGciOiJI...",
#   "user": { "id": 1, "email": "admin@sentinela.gov.br", ... }
# }

# 2. Acessar perfil (use o token do passo 1)
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJI..."
```

### Com Postman/Insomnia

1. **Login**:
   - Method: POST
   - URL: `http://localhost:3000/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@sentinela.gov.br",
       "password": "123456"
     }
     ```
   - Copie o `access_token` da resposta

2. **Profile**:
   - Method: GET
   - URL: `http://localhost:3000/auth/profile`
   - Headers:
     - `Authorization`: `Bearer <access_token>`

### Com Thunder Client (VS Code)

Crie as requisições acima e salve em uma collection para reutilizar.

## Roles e Permissões

### Hierarquia de Roles

```
admin_geral          # Acesso total, sem força específica
    ↓
ponto_focal          # Coordenador de uma força
    ↓
gestor               # Gestor de uma força
    ↓
usuario              # Usuário comum
```

### Matriz de Acesso (Exemplo)

| Ação | admin_geral | ponto_focal | gestor | usuario |
|------|-------------|-------------|--------|---------|
| Ver todas as forças | ✅ | ❌ | ❌ | ❌ |
| Criar usuário | ✅ | ✅ | ✅ | ❌ |
| Editar própria força | ✅ | ✅ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ✅ | ✅ |

## Erros Comuns

### 401 Unauthorized

**Causa**: Token inválido ou expirado

**Solução**:
- Fazer login novamente
- Verificar se token está no header `Authorization: Bearer <token>`
- Verificar se JWT_SECRET não mudou

### 403 Forbidden

**Causa**: Usuário não tem permissão (role insuficiente)

**Solução**:
- Verificar se usuário tem a role necessária
- Contatar administrador para ajustar permissões

### Usuário desativado

**Causa**: `isActive === false`

**Solução**:
- Contatar administrador para reativar conta

## Auditoria

Todas as tentativas de login devem ser registradas na tabela `audit_logs`:

```typescript
// Exemplo de registro de auditoria (a implementar)
await auditRepository.save({
  action: 'LOGIN_SUCCESS',
  userId: user.id,
  targetEntity: 'User',
  ipAddress: request.ip,
  details: { email: user.email },
});
```

## Próximos Passos

1. Implementar endpoint de mudança de senha
2. Implementar refresh tokens
3. Implementar 2FA (autenticação em dois fatores)
4. Implementar rate limiting no login
5. Implementar bloqueio de conta após tentativas falhas
6. Implementar auditoria automática de login
7. Implementar logout (blacklist de tokens)
8. Implementar recuperação de senha via email

## Referências

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
