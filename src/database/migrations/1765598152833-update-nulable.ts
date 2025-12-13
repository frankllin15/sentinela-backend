import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNulable1765598152833 implements MigrationInterface {
  name = 'UpdateNulable1765598152833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_type_enum" AS ENUM('FACE', 'FULL_BODY', 'TATTOO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "media" ("id" SERIAL NOT NULL, "type" "public"."media_type_enum" NOT NULL, "url" character varying(500) NOT NULL, "label" character varying(100), "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "person_id" integer NOT NULL, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "address_primary" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD CONSTRAINT "FK_d6f4789612281b2366f3cfa281b" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT "FK_d6f4789612281b2366f3cfa281b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ALTER COLUMN "address_primary" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TYPE "public"."media_type_enum"`);
  }
}
