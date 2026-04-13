import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProgressColumns1775734308719 implements MigrationInterface {
    name = 'AddProgressColumns1775734308719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "searches" ADD "progress_stage" text`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "progress_pct" integer`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "progress_message" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "progress_message"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "progress_pct"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "progress_stage"`);
    }
}
