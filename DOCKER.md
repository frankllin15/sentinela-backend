# Docker Setup - Sentinela Backend

Este documento descreve como usar Docker para o desenvolvimento e produção do Sentinela Backend.

## Pré-requisitos

- Docker instalado
- Docker Compose instalado

## Iniciar o Banco de Dados

Para iniciar apenas o PostgreSQL em Docker:

```bash
docker-compose up -d postgres
```

Isso irá:
- Criar um container PostgreSQL 15
- Expor a porta 5432
- Criar um volume persistente para os dados
- Usar as credenciais definidas no docker-compose.yml

## Verificar Status do Banco

```bash
# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Verificar health do container
docker-compose ps
```

## Conectar ao Banco de Dados

### Via aplicação local (fora do Docker)

Use o arquivo `.env` com:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=root
DB_PASSWORD=sentinela
DB_DATABASE=sentinela_db
```

Depois execute:
```bash
pnpm start:dev
```

### Via psql (linha de comando)

```bash
docker exec -it sentinela-postgres psql -U root -d sentinela_db
```

## Executar Migrations

Com o banco de dados rodando no Docker:

```bash
# Gerar migration
pnpm migration:generate src/database/migrations/NomeDaMigration

# Executar migrations
pnpm migration:run

# Reverter última migration
pnpm migration:revert
```

## Parar o Banco de Dados

```bash
# Parar sem remover os dados
docker-compose stop postgres

# Parar e remover containers (dados persistem no volume)
docker-compose down

# Parar e remover TUDO (incluindo dados)
docker-compose down -v
```

## Executar Aplicação em Docker (Opcional)

Para rodar a aplicação também em Docker, descomente a seção `app` no `docker-compose.yml` e execute:

```bash
docker-compose up -d
```

Isso irá:
- Construir a imagem da aplicação
- Conectar ao PostgreSQL automaticamente
- Expor a aplicação na porta 3000

## Variáveis de Ambiente

### PostgreSQL Container

Definidas em `docker-compose.yml`:
- `POSTGRES_USER`: root
- `POSTGRES_PASSWORD`: sentinela
- `POSTGRES_DB`: sentinela_db

### Aplicação Container (quando habilitada)

- `NODE_ENV`: development
- `DB_HOST`: postgres (nome do serviço)
- Outras variáveis de `.env`

## Troubleshooting

### Porta 5432 já em uso

Se você tem PostgreSQL instalado localmente:

**Opção 1**: Parar o PostgreSQL local
```bash
# Windows
net stop postgresql-x64-15

# Linux/Mac
sudo systemctl stop postgresql
```

**Opção 2**: Mudar a porta no docker-compose.yml
```yaml
ports:
  - '5433:5432'  # Usa porta 5433 no host
```

E atualizar `.env`:
```env
DB_PORT=5433
```

### Container não inicia

Verificar logs:
```bash
docker-compose logs postgres
```

### Resetar banco de dados

```bash
# Para e remove tudo
docker-compose down -v

# Inicia novamente (banco vazio)
docker-compose up -d postgres

# Executa migrations
pnpm migration:run
```

## Estrutura de Volumes

- `postgres_data`: Dados do PostgreSQL
  - Localização: Gerenciado pelo Docker
  - Ver detalhes: `docker volume inspect sentinela-backend_postgres_data`

## Backup e Restore

### Backup

```bash
docker exec sentinela-postgres pg_dump -U root sentinela_db > backup.sql
```

### Restore

```bash
cat backup.sql | docker exec -i sentinela-postgres psql -U root -d sentinela_db
```

## Produção

Para produção, considere:

1. **Usar secrets do Docker** ao invés de variáveis de ambiente em texto plano
2. **Configurar SSL** para conexão com PostgreSQL
3. **Limitar recursos** (CPU, memória) no docker-compose.yml
4. **Configurar backups automáticos** do volume postgres_data
5. **Usar orquestração** (Kubernetes, Docker Swarm) para alta disponibilidade
