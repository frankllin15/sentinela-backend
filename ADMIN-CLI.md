# Admin CLI - Gerenciamento de Usuários Admin

Este documento descreve como usar o script CLI para criar e gerenciar usuários administrativos no sistema Sentinela.

## Visão Geral

O script `admin:create` permite criar ou atualizar usuários com privilégios administrativos via linha de comando, sem precisar usar o seed automático ou a interface web.

## Uso Básico

```bash
pnpm admin:create --email <email> --name <nome> [opções]
```

## Parâmetros

### Obrigatórios

- `--email <email>`: Email do usuário (deve ser único no sistema)
- `--name <nome>`: Nome completo do usuário

### Opcionais

- `--password <senha>`: Senha do usuário. Se omitido, gera automaticamente uma senha numérica de 6 dígitos
- `--role <role>`: Role do usuário (padrão: `admin_geral`)
  - Opções: `admin_geral`, `ponto_focal`, `gestor`, `usuario`
- `--force-id <id>`: ID da força policial (obrigatório para roles diferentes de `admin_geral`)
- `--update`: Permite atualizar um usuário existente se o email já estiver cadastrado

## Exemplos de Uso

### 1. Criar Admin Geral com Senha Automática

```bash
pnpm admin:create --email admin@sentinela.gov.br --name "Administrador Geral"
```

Saída:
```
╔════════════════════════════════════════════════════════════════╗
║           SENTINELA - Criação de Usuários Admin               ║
╚════════════════════════════════════════════════════════════════╝

🔌 Conectando ao banco de dados...
✅ Conexão estabelecida

➕ Criando novo usuário...

════════════════════════════════════════════════════════════════
✅ USUÁRIO CRIADO COM SUCESSO
════════════════════════════════════════════════════════════════
ID:         1
Nome:       Administrador Geral
Email:      admin@sentinela.gov.br
Role:       admin_geral
Força ID:   N/A (admin_geral)
Senha:      784521 (gerada automaticamente)
════════════════════════════════════════════════════════════════
⚠️  ATENÇÃO: Usuário deve alterar a senha no primeiro login!
════════════════════════════════════════════════════════════════
```

### 2. Criar Admin Geral com Senha Específica

```bash
pnpm admin:create --email admin@sentinela.gov.br --name "Admin Principal" --password 123456
```

### 3. Criar Gestor de Força Policial

```bash
pnpm admin:create --email gestor.pf@sentinela.gov.br --name "Gestor Polícia Federal" --role gestor --force-id 1
```

### 4. Criar Ponto Focal

```bash
pnpm admin:create --email ponto.focal@prf.gov.br --name "Ponto Focal PRF" --role ponto_focal --force-id 2
```

### 5. Atualizar Usuário Existente

```bash
pnpm admin:create --email admin@sentinela.gov.br --name "Admin Atualizado" --password novaSenha123 --update
```

## IDs das Forças Policiais

Os IDs padrão das forças policiais (definidos no seed) são:

| ID | Força Policial |
|----|----------------|
| 1  | Polícia Federal |
| 2  | Polícia Rodoviária Federal |
| 3  | Polícia Militar |
| 4  | Polícia Civil |
| 5  | Polícia Penal |

## Regras de Negócio

### Admin Geral (`admin_geral`)
- Não pode ter força policial associada
- Pode operar em todas as forças
- Não requer `--force-id`

### Outras Roles (`ponto_focal`, `gestor`, `usuario`)
- Devem ter uma força policial associada
- Requerem `--force-id` ao criar um novo usuário
- São restritas à força policial especificada

### Senhas
- Se não fornecida, será gerada automaticamente uma senha numérica de 6 dígitos
- Todas as senhas são armazenadas com hash bcrypt (10 rounds)
- Por padrão, `mustChangePassword` é definido como `true`, forçando troca no primeiro login

### Atualização de Usuários
- Por padrão, o script rejeita criação de usuário com email duplicado
- Use `--update` para atualizar um usuário existente
- Ao atualizar, todos os campos fornecidos serão sobrescritos

## Ajuda

Para ver a ajuda do comando:

```bash
pnpm admin:create --help
```

ou

```bash
pnpm admin:create -h
```

## Requisitos

- Banco de dados PostgreSQL deve estar rodando e acessível
- Variáveis de ambiente devem estar configuradas no `.env`
- As forças policiais devem estar previamente seeded no banco

## Solução de Problemas

### Erro: "Usuário com email X já existe"

Use a flag `--update` para atualizar o usuário existente:

```bash
pnpm admin:create --email admin@test.com --name "Novo Nome" --update
```

### Erro: "Role X requer --force-id"

Ao criar usuários com roles diferentes de `admin_geral`, é obrigatório especificar a força policial:

```bash
pnpm admin:create --email gestor@test.com --name "Gestor" --role gestor --force-id 1
```

### Erro: "Admin geral não pode ter força policial associada"

Remova o parâmetro `--force-id` ao criar um `admin_geral`:

```bash
pnpm admin:create --email admin@test.com --name "Admin" --role admin_geral
```

### Erro de Conexão com Banco de Dados

Verifique se:
1. O PostgreSQL está rodando: `docker-compose up -d postgres`
2. As credenciais no `.env` estão corretas
3. O banco de dados foi criado

## Segurança

- O script sempre define `mustChangePassword = true`, garantindo que o usuário troque a senha no primeiro login
- Senhas são sempre armazenadas com hash bcrypt
- As credenciais são exibidas apenas no momento da criação/atualização
- Não há log permanente das senhas geradas

## Integração com Outros Processos

### Uso em Scripts de Deploy

```bash
#!/bin/bash
# deploy.sh

# Rodar migrations
pnpm migration:run

# Criar admin inicial
pnpm admin:create --email admin@empresa.gov.br --name "Administrador Sistema" --password "${ADMIN_PASSWORD}"
```

### Uso em CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Create initial admin
  run: |
    pnpm admin:create \
      --email admin@sentinela.gov.br \
      --name "Admin CI/CD" \
      --password ${{ secrets.ADMIN_PASSWORD }}
```

## Diferença entre Seed e CLI

| Aspecto | Seed Automático | CLI Script |
|---------|-----------------|------------|
| Execução | Automática no início da aplicação | Manual via comando |
| Controle | Cria apenas se não existir | Pode criar ou atualizar |
| Customização | Valores fixos no código | Parâmetros personalizáveis |
| Senha | Sempre gerada aleatoriamente | Pode ser especificada |
| Uso | Ambiente de desenvolvimento | Produção, deploy, testes |
