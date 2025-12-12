Aqui está a descrição técnica objetiva dos campos da entidade **`Person`** (Indivíduo) e como ela se relaciona com as demais entidades para compor o fluxo de uma abordagem policial, baseada nos requisitos do Sentinela.

### 1\. Campos da Entidade `Person`

[cite_start]Estes são os atributos essenciais para a tabela no banco de dados, mapeados diretamente dos requisitos de cadastro de indivíduos[cite: 55].

| Campo (DB/Code) | Tipo de Dado | Obrigatório | Descrição / Regra |
| :--- | :--- | :--- | :--- |
| `id` | Integer (PK) | Sim | Identificador único auto-incremento. |
| `fullName` | String | Sim | [cite_start]Nome completo do indivíduo[cite: 56]. |
| `nickname` | String | Não | [cite_start]"Vulgo" ou apelido[cite: 57]. |
| `cpf` | String (Unique) | Não\* | [cite_start]CPF (chave para verificação de duplicidade)[cite: 58, 124]. |
| `rg` | String | Não | [cite_start]Número da identidade[cite: 59]. |
| `voterId` | String | Não | [cite_start]Título de eleitor[cite: 60]. |
| `addressPrimary` | Text | Sim | [cite_start]Endereço principal (Endereço 1)[cite: 61]. |
| `addressSecondary` | Text | Não | [cite_start]Endereço secundário (Endereço 2)[cite: 63]. |
| `latitude` | Decimal/Float | Sim | [cite_start]Capturado via API de Geolocalização[cite: 62]. |
| `longitude` | Decimal/Float | Sim | [cite_start]Capturado via API de Geolocalização[cite: 62]. |
| `motherName` | String | Não | [cite_start]Nome da Mãe (usado em busca fuzzy)[cite: 64, 125]. |
| `fatherName` | String | Não | [cite_start]Nome do Pai (usado em busca fuzzy)[cite: 65, 125]. |
| `warrantStatus` | Text | Não | [cite_start]Descrição do Mandado de Prisão[cite: 66]. |
| `warrantFileUrl` | String (URL) | Não | [cite_start]Link para PDF do mandado (S3)[cite: 66]. |
| `notes` | Text | Não | [cite_start]Observações gerais da abordagem[cite: 67]. |
| `isConfidential` | Boolean | Sim | [cite_start]Define se o registro é sigiloso (Default: `false`)[cite: 68]. |
| `createdBy` | Integer (FK) | Sim | [cite_start]ID do Usuário que criou (Metadata)[cite: 69]. |
| `updatedBy` | Integer (FK) | Não | [cite_start]ID do último Usuário que alterou (Metadata)[cite: 69]. |

*\*O CPF não é estritamente obrigatório pois o indivíduo pode estar sem documento na abordagem, mas é um campo chave para duplicidade.*

-----

### 2\. Relação de Abordagens (Modelo de Dados)

A "abordagem" no sistema Sentinela não é apenas um registro isolado; ela é composta pela relação entre o **Indivíduo (`Person`)**, quem realizou a abordagem (**`User`**) e as evidências visuais (**`Photos`**).

#### A. Relacionamento `Person` ↔ `Media` (1:N)

Cada indivíduo abordado possui múltiplas fotos associadas a ele.

  * **Abordagem:** Uma entidade `Person` pode ter **N** registros na tabela `Media`.
  * [cite_start]**Tipos:** As fotos são categorizadas via coluna `type`: `FACE` (Rosto), `FULL_BODY` (Corpo Inteiro) ou `TATTOO` (Tatuagem)[cite: 72].
  * [cite_start]**Tatuagens:** Tatuagens possuem campos extras como `label` (Local/Nome) e `description` na tabela de mídia[cite: 75].

#### B. Relacionamento `Person` ↔ `User` (N:1) - Auditoria

Define a responsabilidade sobre o registro.

  * [cite_start]**Criação:** Todo `Person` pertence a um `User` (criador) que, por sua vez, pertence a uma `Force` (Força Policial)[cite: 47, 69].
  * **Segurança:** A visualização deste relacionamento é controlada. [cite_start]Se o `Person` for `isConfidential = true`, apenas `Users` com role `admin`, `ponto_focal` ou `gestor` podem ver quem criou ou acessar o registro[cite: 35, 40, 45].

#### C. Relacionamento `Person` ↔ `AuditLog` (1:N)

Para garantir a integridade da prova policial.

  * [cite_start]Qualquer alteração nos dados do `Person` (ex: atualizar endereço ou adicionar tatuagem) gera um novo registro na tabela `AuditLog` contendo o "antes e depois" (`details` JSON), garantindo o histórico da abordagem[cite: 86, 99].

### Sugestão para Implementação (NestJS TypeORM)

```typescript
// Exemplo simplificado da relação na Entidade Person
@Entity('people')
export class Person {
  // ... campos simples (nome, cpf, etc)

  @OneToMany(() => Media, (media) => media.person, { cascade: true })
  photos: Media[];

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;

  @Column({ default: false })
  isConfidential: boolean;
}
```