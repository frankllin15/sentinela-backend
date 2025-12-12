import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAudit1765498529987 implements MigrationInterface {
  name = 'UpdateAudit1765498529987';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_status_enum" AS ENUM('success', 'failure')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "status" "public"."audit_logs_status_enum" NOT NULL DEFAULT 'success'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_status_enum"`);
  }
}
