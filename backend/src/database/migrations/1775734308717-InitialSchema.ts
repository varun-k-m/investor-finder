import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1775734308717 implements MigrationInterface {
    name = 'InitialSchema1775734308717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clerk_id" text NOT NULL, "email" text NOT NULL, "name" text, "plan" text NOT NULL DEFAULT 'free', "searches_used" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_bc7be2d54c239f9e1d8a5292117" UNIQUE ("clerk_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_bc7be2d54c239f9e1d8a5292117" UNIQUE ("clerk_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "searches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "raw_input" text NOT NULL, "parsed_idea" jsonb, "status" text NOT NULL DEFAULT 'pending', "result_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_60a4e082658af4c8834c23f6fad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_searches_status" ON "searches" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_searches_user_id" ON "searches" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "investor_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "search_id" uuid NOT NULL, "canonical_name" text NOT NULL, "fund_name" text, "website" text, "sectors" text array, "stages" text array, "geo_focus" text array, "check_min" bigint, "check_max" bigint, "contact_email" text, "linkedin_url" text, "twitter_url" text, "sources" text array, "source_urls" text array, "raw_data" jsonb, "fit_score" numeric(5,2), "sector_fit" numeric(5,2), "stage_fit" numeric(5,2), "budget_fit" numeric(5,2), "geo_fit" numeric(5,2), "fit_reasoning" text, "rank_position" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_154d889a096b3948f856b4ca53f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_investor_profiles_fit_score" ON "investor_profiles" ("fit_score") `);
        await queryRunner.query(`CREATE INDEX "idx_investor_profiles_search_id" ON "investor_profiles" ("search_id") `);
        await queryRunner.query(`CREATE TABLE "saved_investors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "investor_id" uuid NOT NULL, "status" text NOT NULL DEFAULT 'saved', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_eb4e7a2b28e510857641b5db14e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_saved_investors_user_id" ON "saved_investors" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "pitch_drafts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "investor_id" uuid NOT NULL, "content" text NOT NULL, "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9eaeda4e067616db2b4a4f06730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "searches" ADD CONSTRAINT "FK_709618ab684de7a747afe0ba84b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "investor_profiles" ADD CONSTRAINT "FK_ed94efccc73693adebdec6de464" FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_investors" ADD CONSTRAINT "FK_c521e9bc10a25b6cb1924dfee20" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_investors" ADD CONSTRAINT "FK_c6a686fe4b1372b7e53449b91ef" FOREIGN KEY ("investor_id") REFERENCES "investor_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pitch_drafts" ADD CONSTRAINT "FK_01ea2490727b9f276a8c9ea182b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pitch_drafts" ADD CONSTRAINT "FK_ab77635437dec22e6794be2ab68" FOREIGN KEY ("investor_id") REFERENCES "investor_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pitch_drafts" DROP CONSTRAINT "FK_ab77635437dec22e6794be2ab68"`);
        await queryRunner.query(`ALTER TABLE "pitch_drafts" DROP CONSTRAINT "FK_01ea2490727b9f276a8c9ea182b"`);
        await queryRunner.query(`ALTER TABLE "saved_investors" DROP CONSTRAINT "FK_c6a686fe4b1372b7e53449b91ef"`);
        await queryRunner.query(`ALTER TABLE "saved_investors" DROP CONSTRAINT "FK_c521e9bc10a25b6cb1924dfee20"`);
        await queryRunner.query(`ALTER TABLE "investor_profiles" DROP CONSTRAINT "FK_ed94efccc73693adebdec6de464"`);
        await queryRunner.query(`ALTER TABLE "searches" DROP CONSTRAINT "FK_709618ab684de7a747afe0ba84b"`);
        await queryRunner.query(`DROP TABLE "pitch_drafts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_saved_investors_user_id"`);
        await queryRunner.query(`DROP TABLE "saved_investors"`);
        await queryRunner.query(`DROP INDEX "public"."idx_investor_profiles_search_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_investor_profiles_fit_score"`);
        await queryRunner.query(`DROP TABLE "investor_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."idx_searches_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_searches_status"`);
        await queryRunner.query(`DROP TABLE "searches"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
