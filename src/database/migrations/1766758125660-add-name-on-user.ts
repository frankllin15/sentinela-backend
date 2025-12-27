import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameOnUser1766758125660 implements MigrationInterface {
  name = 'AddNameOnUser1766758125660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(100) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
