import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePeople1765917190038 implements MigrationInterface {
  name = 'UpdatePeople1765917190038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "latitude" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "longitude" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "longitude" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "latitude" SET NOT NULL`,
    );
  }
}
