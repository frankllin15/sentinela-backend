Para implementar o relacionamento **OneToMany** (Um para Muitos) entre **Person** e **Media** no NestJS com TypeORM, você precisará configurar as duas entidades (`person.entity.ts` e `media.entity.ts`).

O conceito chave aqui é:

1.  **Person (Um):** Pode ter várias fotos.
2.  **Media (Muitos):** Cada foto pertence a uma única pessoa.

Aqui está o código completo:

### 1\. Entidade de Mídia (`media.entity.ts`)

Esta é a ponta "Muitos" (Many). Ela segura a chave estrangeira (`personId`).

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Person } from '../../people/entities/person.entity'; // Ajuste o caminho conforme sua estrutura

export enum MediaType {
  FACE = 'FACE',
  FULL_BODY = 'FULL_BODY',
  TATTOO = 'TATTOO',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType; // Ex: FACE, TATTOO

  @Column()
  url: string; // URL do S3/R2

  @Column({ nullable: true })
  label: string; // Ex: "Braço Direito" (usado para Tatuagens)

  @Column({ type: 'text', nullable: true })
  description: string; // Ex: "Dragão com flores"

  @CreateDateColumn()
  createdAt: Date;

  // --- RELACIONAMENTO (Many side) ---
  @ManyToOne(() => Person, (person) => person.photos, {
    onDelete: 'CASCADE', // Se deletar a Pessoa, deleta as fotos
    nullable: false,     // Uma foto não pode existir sem dono
  })
  @JoinColumn({ name: 'personId' }) // Nome da coluna no banco
  person: Person;

  @Column()
  personId: number; // Útil para acessar o ID direto sem carregar a relação inteira
}
```

### 2\. Entidade Pessoa (`person.entity.ts`)

Esta é a ponta "Um" (One). Ela terá uma lista (array) de mídias.

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Media } from '../../media/entities/media.entity'; 

@Entity('people')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  cpf: string;

  // ... outros campos (nickname, motherName, address...)

  @CreateDateColumn()
  createdAt: Date;

  // --- RELACIONAMENTO (One side) ---
  @OneToMany(() => Media, (media) => media.person, {
    cascade: true, // Permite salvar a Pessoa e as Fotos de uma vez só
    eager: false,  // Não carrega fotos automaticamente sempre (melhor performance)
  })
  photos: Media[];
}
```

### 3\. Como usar na Prática (Service)

Graças ao `cascade: true` na entidade `Person`, você pode salvar tudo em uma única chamada no `PersonService`. O TypeORM cuida de criar o ID da pessoa e vincular nas fotos automaticamente.

**Exemplo de Salvamento (Create):**

```typescript
// No seu person.service.ts
async create(createPersonDto: CreatePersonDto) {
  // O DTO recebido do frontend já vem com o array de photos
  /*
    Exemplo de payload:
    {
      "fullName": "João Silva",
      "cpf": "123.456.789-00",
      "photos": [
         { "type": "FACE", "url": "s3://..." },
         { "type": "TATTOO", "url": "s3://...", "label": "Braço" }
      ]
    }
  */

  const person = this.personRepository.create(createPersonDto);
  // O TypeORM identifica o array 'photos' e prepara a inserção na tabela Media
  
  return await this.personRepository.save(person);
}
```

**Exemplo de Leitura (Find):**
Para trazer as fotos junto com a pessoa, você deve usar `relations`.

```typescript
async findOne(id: number) {
  return await this.personRepository.findOne({
    where: { id },
    relations: ['photos'], // Explicitamente pede para trazer as fotos
  });
}
```