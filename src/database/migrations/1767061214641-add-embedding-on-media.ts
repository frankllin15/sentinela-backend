import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmbeddingOnMedia1767061214641 implements MigrationInterface {
  name = 'AddEmbeddingOnMedia1767061214641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" ADD "embedding" vector`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "name" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "name" SET DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "embedding"`);
  }
}
