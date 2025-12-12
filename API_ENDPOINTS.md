# API Endpoints - Sentinela Backend

## Auth (`/auth`)

### `POST /auth/login` (público)
**Body:** `{ email: string, password: string }`
**Response:** `{ access_token: string, user: {...} }`

### `GET /auth/profile`
**Auth:** JWT Bearer
**Response:** User profile

---

## Users (`/users`)
**Roles:** `admin_geral`, `gestor`

### `POST /users`
**CreateUserDto:**
```
email: string (required)
password: string (required, 6 digits)
role: UserRole (required) - admin_geral | ponto_focal | gestor | usuario
forceId?: number (optional, required for non-admin_geral)
```

### `GET /users`
**Response:** User[]

### `GET /users/:id`
**Response:** User

### `PATCH /users/:id`
**UpdateUserDto:** Partial<CreateUserDto>

### `DELETE /users/:id`

---

## Forces (`/forces`)

### `POST /forces`
**Roles:** `admin_geral`
**CreateForceDto:**
```
name: string (required, max 100 chars)
```

### `GET /forces`
**Roles:** `admin_geral`, `ponto_focal`, `gestor`
**Response:** Force[]

### `GET /forces/:id`
**Roles:** `admin_geral`, `ponto_focal`, `gestor`
**Response:** Force

### `PATCH /forces/:id`
**Roles:** `admin_geral`
**UpdateForceDto:** Partial<CreateForceDto>

### `DELETE /forces/:id`
**Roles:** `admin_geral`

---

## People (`/people`)
**Roles:** `admin_geral`, `gestor`, `ponto_focal`, `usuario`

### `POST /people`
**CreatePersonDto:**
```
fullName: string (required, max 255)
nickname?: string (max 100)
cpf?: string (format: 000.000.000-00 ou 00000000000)
rg?: string (max 20)
voterId?: string (max 20)
addressPrimary: string (required)
addressSecondary?: string
latitude: number (required, -90 to 90)
longitude: number (required, -180 to 180)
motherName?: string (max 255)
fatherName?: string (max 255)
warrantStatus?: string
warrantFileUrl?: string (URL)
notes?: string
isConfidential?: boolean
```
**Validações:**
- CPF único
- Nome + Nome da Mãe único (case-insensitive)

### `GET /people`
**QueryPersonDto:**
```
fullName?: string
nickname?: string
cpf?: string
motherName?: string
fatherName?: string
isConfidential?: boolean
createdBy?: number
page?: number (default: 1, min: 1)
limit?: number (default: 20, min: 1, max: 100)
```
**Response:** `{ data: Person[], total: number, page: number, limit: number }`

### `GET /people/cpf/:cpf`
**Response:** Person | null

### `GET /people/:id`
**Response:** Person

### `PATCH /people/:id`
**UpdatePersonDto:** Partial<CreatePersonDto>

### `DELETE /people/:id`

---

## Media (`/media`)
**Roles:** `admin_geral`, `gestor`, `ponto_focal`, `usuario`

### `POST /media`
**CreateMediaDto:**
```
type: MediaType (required) - FACE | FULL_BODY | TATTOO
url: string (required, max 500)
label?: string (max 100)
description?: string
personId: number (required)
```

### `GET /media`
**QueryMediaDto:**
```
type?: MediaType - FACE | FULL_BODY | TATTOO
personId?: number
page?: number (default: 1, min: 1)
limit?: number (default: 10, min: 1)
```
**Response:** `{ data: Media[], total: number, page: number, limit: number }`

### `GET /media/:id`
**Response:** Media

### `PATCH /media/:id`
**UpdateMediaDto:** Partial<CreateMediaDto>

### `DELETE /media/:id`

---

## Audit (`/audit`)
**Roles:** `admin_geral`

### `GET /audit`
**QueryAuditDto:**
```
userId?: number
action?: string
targetEntity?: string
status?: AuditStatus - success | failure
startDate?: string (ISO 8601)
endDate?: string (ISO 8601)
page?: number (default: 1, min: 1)
limit?: number (default: 20, min: 1, max: 100)
```
**Response:** `{ data: AuditLog[], total: number, page: number, limit: number }`

### `GET /audit/user/:userId`
**Query:** QueryAuditDto
**Response:** Paginated audit logs

### `GET /audit/entity/:entity`
**Query:** QueryAuditDto
**Response:** Paginated audit logs

### `GET /audit/:id`
**Response:** AuditLog

---

## Autenticação
- **Público:** `/auth/login`
- **Autenticado:** Todos demais endpoints requerem `Authorization: Bearer <token>`

## Enums
- **UserRole:** `admin_geral`, `ponto_focal`, `gestor`, `usuario`
- **MediaType:** `FACE`, `FULL_BODY`, `TATTOO`
- **AuditStatus:** `success`, `failure`

## Regras de Negócio
- **People:** Validação de unicidade por CPF e por Nome+Nome da Mãe (case-insensitive)
- **Confidencialidade:** Registros confidenciais acessíveis apenas para `admin_geral`, `gestor`, `ponto_focal`
- **Audit:** Operações CUD auditadas automaticamente
- **Senha inicial:** 6 dígitos numéricos, `mustChangePassword = true` na criação
