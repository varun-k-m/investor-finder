import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchFilterColumns1775734308718 implements MigrationInterface {
    name = 'AddSearchFilterColumns1775734308718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "searches" ADD "sectors" text`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "stages" text`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "geo_focus" text`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "budget_min" integer`);
        await queryRunner.query(`ALTER TABLE "searches" ADD "budget_max" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "budget_max"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "budget_min"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "geo_focus"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "stages"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP COLUMN "sectors"`);
    }
}
