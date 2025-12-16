import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeople1765500490681 implements MigrationInterface {
  name = 'AddPeople1765500490681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "people" ("id" SERIAL NOT NULL, "full_name" character varying(255) NOT NULL, "nickname" character varying(100), "cpf" character varying(14), "rg" character varying(20), "voter_id" character varying(20), "address_primary" text NOT NULL, "address_secondary" text, "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "mother_name" character varying(255), "father_name" character varying(255), "warrant_status" text, "warrant_file_url" character varying(500), "notes" text, "is_confidential" boolean NOT NULL DEFAULT false, "created_by" integer NOT NULL, "updated_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_051da4f26641e2e7986ffc91497" UNIQUE ("cpf"), CONSTRAINT "PK_aa866e71353ee94c6cc51059c5b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_78439691d7be6252089a241925a" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_1852998ecc03c7fdef883353f31" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_1852998ecc03c7fdef883353f31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_78439691d7be6252089a241925a"`,
    );
    await queryRunner.query(`DROP TABLE "people"`);
  }
}
