# Seeds - Sistema Sentinela

Este documento descreve o sistema de seeds automático do Sentinela Backend.

## Visão Geral

O sistema implementa seeds automáticos que são executados toda vez que a aplicação inicia via `OnModuleInit`. Os seeds garantem que os dados essenciais existam no banco de dados.

## Seeds Implementados

### 1. Forças Policiais

**Arquivo**: `src/database/seed.service.ts` - método `seedForces()`

Cria automaticamente as 5 forças policiais brasileiras:

1. Polícia Federal
2. Polícia Rodoviária Federal
3. Polícia Militar
4. Polícia Civil
5. Polícia Penal

**Comportamento**:
- Verifica se cada força já existe antes de criar
- Cria apenas as forças que não existem
- Log de confirmação para cada força criada

**Exemplo de log**:
```
[SeedService] Força criada: Polícia Federal
[SeedService] Força criada: Polícia Rodoviária Federal
[SeedService] Seed de forças policiais concluído
```

### 2. Admin Geral

**Arquivo**: `src/database/seed.service.ts` - método `seedAdminUser()`

Cria automaticamente um usuário admin geral com:

- **Email**: `admin@sentinela.gov.br`
- **Senha**: Gerada automaticamente (6 dígitos numéricos)
- **Role**: `admin_geral`
- **Force**: `null` (admin geral não pertence a nenhuma força)
- **Must Change Password**: `true`

**Comportamento**:
- Verifica se já existe um usuário com role `admin_geral`
- Se não existir, cria um novo admin
- Gera senha numérica aleatória de 6 dígitos
- Hash da senha com bcrypt (10 rounds)
- **Exibe as credenciais no console APENAS na criação**

**Exemplo de log** (apenas na primeira execução):
```
[SeedService] ════════════════════════════════════════════════════════════
[SeedService] CREDENCIAIS DE ADMIN GERAL CRIADAS
[SeedService] ════════════════════════════════════════════════════════════
[SeedService] Email: admin@sentinela.gov.br
[SeedService] Senha temporária: 847392
[SeedService] ════════════════════════════════════════════════════════════
[SeedService] ATENÇÃO: Esta senha é temporária e deve ser alterada no primeiro login!
[SeedService] ════════════════════════════════════════════════════════════
```

**Execuções subsequentes**:
```
[SeedService] Admin geral já existe - seed não executado
```

## Como Funciona

### Execução Automática

O `SeedService` implementa a interface `OnModuleInit` do NestJS:

```typescript
export class SeedService implements OnModuleInit {
  async onModuleInit() {
    await this.seedForces();
    await this.seedAdminUser();
  }
}
```

Isso significa que **sempre que a aplicação iniciar**, os seeds serão executados automaticamente. Porém, como há verificações de existência, os dados não serão duplicados.

### Segurança

1. **Senha Numérica Aleatória**:
   ```typescript
   private generateNumericPassword(length: number = 6): string {
     let password = '';
     for (let i = 0; i < length; i++) {
       password += Math.floor(Math.random() * 10).toString();
     }
     return password;
   }
   ```

2. **Hash com Bcrypt**:
   ```typescript
   const hashedPassword = await bcrypt.hash(numericPassword, 10);
   ```

3. **Credenciais Exibidas APENAS Uma Vez**:
   - Console.log acontece SOMENTE quando o admin é criado
   - Em produção, capture stdout na primeira execução
   - Senha deve ser alterada no primeiro login

## Fluxo de Inicialização

```
1. Aplicação inicia
   ↓
2. NestJS carrega DatabaseModule
   ↓
3. SeedService.onModuleInit() é chamado
   ↓
4. seedForces() executa
   ├─ Verifica forças existentes
   ├─ Cria forças faltantes
   └─ Log de conclusão
   ↓
5. seedAdminUser() executa
   ├─ Verifica se admin_geral existe
   ├─ Se NÃO existe:
   │  ├─ Gera senha numérica de 6 dígitos
   │  ├─ Hash da senha com bcrypt
   │  ├─ Cria usuário admin
   │  └─ EXIBE CREDENCIAIS NO CONSOLE
   └─ Se existe: apenas log
   ↓
6. Aplicação pronta para uso
```

## Uso em Desenvolvimento

### Primeira Execução

```bash
# 1. Iniciar o banco de dados
docker-compose up -d postgres

# 2. Executar migrations
pnpm migration:run

# 3. Iniciar a aplicação
pnpm start:dev
```

**Resultado**:
- Banco de dados criado via migrations
- Seeds executados automaticamente
- Credenciais do admin exibidas no console
- **COPIE AS CREDENCIAIS!**

### Resetar Dados

Para resetar e reexecutar seeds:

```bash
# Parar a aplicação

# Resetar o banco
docker-compose down -v
docker-compose up -d postgres

# Executar migrations
pnpm migration:run

# Iniciar aplicação (seeds rodarão novamente)
pnpm start:dev
```

## Uso em Produção

### Deployment Seguro

1. **Primeira Execução**:
   ```bash
   # Executar migrations
   npm run migration:run

   # Iniciar aplicação e capturar credenciais
   npm run start:prod 2>&1 | tee deployment.log
   ```

2. **Extrair Credenciais**:
   ```bash
   grep -A 5 "CREDENCIAIS DE ADMIN GERAL" deployment.log
   ```

3. **Armazenar com Segurança**:
   - Enviar credenciais via canal seguro (ex: 1Password, Vault)
   - **NUNCA** commitar o log
   - Deletar o arquivo `deployment.log` após extrair credenciais

4. **Trocar Senha**:
   - Fazer login com credenciais temporárias
   - Sistema deve forçar troca de senha (via `mustChangePassword`)

### Variáveis de Ambiente

Considere tornar o email do admin configurável via `.env`:

```env
# .env
ADMIN_EMAIL=admin@seu-dominio.gov.br
```

Ajuste o código:
```typescript
const adminEmail = process.env.ADMIN_EMAIL || 'admin@sentinela.gov.br';
```

## Personalização

### Adicionar Novos Seeds

1. **Criar método no SeedService**:
   ```typescript
   private async seedNovaEntidade(): Promise<void> {
     // Lógica de seed
   }
   ```

2. **Adicionar ao onModuleInit**:
   ```typescript
   async onModuleInit() {
     await this.seedForces();
     await this.seedAdminUser();
     await this.seedNovaEntidade(); // Novo seed
   }
   ```

### Modificar Senha do Admin

Por padrão, a senha tem 6 dígitos. Para modificar:

```typescript
// Alterar comprimento
const numericPassword = this.generateNumericPassword(8); // 8 dígitos

// Ou usar senha específica (NÃO RECOMENDADO em produção)
const numericPassword = '123456';
```

### Desabilitar Seeds (Não Recomendado)

Se por algum motivo precisar desabilitar seeds temporariamente:

```typescript
async onModuleInit() {
  if (process.env.DISABLE_SEEDS === 'true') {
    this.logger.warn('Seeds desabilitados via variável de ambiente');
    return;
  }

  await this.seedForces();
  await this.seedAdminUser();
}
```

## Troubleshooting

### Admin não foi criado

**Sintoma**: Aplicação inicia mas não vejo as credenciais

**Causas possíveis**:
1. Admin já existe no banco
2. Banco de dados não conectado
3. Migrations não executadas

**Solução**:
```bash
# Verificar se admin existe
docker exec -it sentinela-postgres psql -U root -d sentinela_db \
  -c "SELECT * FROM users WHERE role='admin_geral';"

# Se existir, deletar para recriar
docker exec -it sentinela-postgres psql -U root -d sentinela_db \
  -c "DELETE FROM users WHERE role='admin_geral';"

# Reiniciar aplicação
```

### Forças duplicadas

**Sintoma**: Erro de chave única ao criar forças

**Causa**: Constraint `UNIQUE` na coluna `name`

**Solução**: O seed já verifica duplicatas, mas se ocorrer:
```bash
# Verificar forças existentes
docker exec -it sentinela-postgres psql -U root -d sentinela_db \
  -c "SELECT * FROM forces;"

# Limpar tabela se necessário
docker exec -it sentinela-postgres psql -U root -d sentinela_db \
  -c "DELETE FROM forces;"
```

### Senha não aparece no console

**Sintoma**: Aplicação inicia mas credenciais não são exibidas

**Causa**: Admin já foi criado anteriormente

**Solução**: Normal - credenciais só aparecem na primeira criação. Se perdeu a senha:
1. Opção A: Resetar banco e recriar
2. Opção B: Atualizar senha manualmente:
   ```bash
   # Gerar hash de nova senha (usar Node.js REPL)
   node
   > const bcrypt = require('bcrypt');
   > bcrypt.hash('654321', 10).then(console.log);
   # Copiar o hash

   # Atualizar no banco
   docker exec -it sentinela-postgres psql -U root -d sentinela_db \
     -c "UPDATE users SET password='$2b$10$...' WHERE role='admin_geral';"
   ```

## Arquitetura

### Arquivos Envolvidos

- `src/database/seed.service.ts` - Lógica de seeding
- `src/database/database.module.ts` - Módulo de banco de dados
- `src/app.module.ts` - Importa DatabaseModule
- `src/forces/entities/force.entity.ts` - Entidade Force
- `src/users/entities/user.entity.ts` - Entidade User

### Dependências

- `@nestjs/typeorm` - Integração TypeORM
- `typeorm` - ORM
- `bcrypt` - Hash de senhas
- `@types/bcrypt` - Types do bcrypt (dev)

## Segurança e Compliance

### Boas Práticas

✅ **Implementadas**:
- Senha gerada aleatoriamente
- Hash com bcrypt (10 rounds)
- Credenciais exibidas apenas uma vez
- Flag `mustChangePassword` ativada
- Verificação de existência antes de criar

⚠️ **Recomendações Adicionais**:
- Em produção, use logger que não persiste credenciais
- Considere usar secrets manager (AWS Secrets, Vault, etc.)
- Implemente auditoria de primeiro login
- Force troca de senha via API
- Monitore tentativas de login do admin

### Compliance

Para conformidade com LGPD e normas de segurança:

1. **Log de Auditoria**: Registre a criação do admin em `audit_logs`
2. **Retenção**: Defina política de retenção para logs
3. **Criptografia**: Considere criptografar logs em repouso
4. **Acesso**: Restrinja quem pode ver stdout em produção

## Próximos Passos

1. Implementar endpoint de troca de senha
2. Implementar guard que força troca de senha no primeiro login
3. Adicionar auditoria na criação do admin
4. Configurar logger customizado para produção
5. Implementar seeds para dados de teste (apenas dev/staging)
