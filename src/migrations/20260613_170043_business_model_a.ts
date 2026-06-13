import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_claim_status" AS ENUM('unclaimed', 'pending', 'verified');
  CREATE TYPE "public"."enum_businesses_nace_category" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  CREATE TYPE "public"."enum__businesses_v_version_claim_status" AS ENUM('unclaimed', 'pending', 'verified');
  CREATE TYPE "public"."enum__businesses_v_version_nace_category" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  ALTER TABLE "businesses" ADD COLUMN "social_linkedin" varchar;
  ALTER TABLE "businesses" ADD COLUMN "social_tiktok" varchar;
  ALTER TABLE "businesses" ADD COLUMN "social_youtube" varchar;
  ALTER TABLE "businesses" ADD COLUMN "video" varchar;
  ALTER TABLE "businesses" ADD COLUMN "claim_status" "enum_businesses_claim_status" DEFAULT 'unclaimed';
  ALTER TABLE "businesses" ADD COLUMN "owner_id" integer;
  ALTER TABLE "businesses" ADD COLUMN "nace_category" "enum_businesses_nace_category";
  ALTER TABLE "_businesses_v" ADD COLUMN "version_social_linkedin" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_social_tiktok" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_social_youtube" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_video" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_claim_status" "enum__businesses_v_version_claim_status" DEFAULT 'unclaimed';
  ALTER TABLE "_businesses_v" ADD COLUMN "version_owner_id" integer;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_nace_category" "enum__businesses_v_version_nace_category";
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_members_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_businesses_v" ADD CONSTRAINT "_businesses_v_version_owner_id_members_id_fk" FOREIGN KEY ("version_owner_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "businesses_owner_idx" ON "businesses" USING btree ("owner_id");
  CREATE INDEX "businesses_nace_category_idx" ON "businesses" USING btree ("nace_category");
  CREATE INDEX "_businesses_v_version_version_owner_idx" ON "_businesses_v" USING btree ("version_owner_id");
  CREATE INDEX "_businesses_v_version_version_nace_category_idx" ON "_businesses_v" USING btree ("version_nace_category");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP CONSTRAINT "businesses_owner_id_members_id_fk";
  
  ALTER TABLE "_businesses_v" DROP CONSTRAINT "_businesses_v_version_owner_id_members_id_fk";
  
  DROP INDEX "businesses_owner_idx";
  DROP INDEX "businesses_nace_category_idx";
  DROP INDEX "_businesses_v_version_version_owner_idx";
  DROP INDEX "_businesses_v_version_version_nace_category_idx";
  ALTER TABLE "businesses" DROP COLUMN "social_linkedin";
  ALTER TABLE "businesses" DROP COLUMN "social_tiktok";
  ALTER TABLE "businesses" DROP COLUMN "social_youtube";
  ALTER TABLE "businesses" DROP COLUMN "video";
  ALTER TABLE "businesses" DROP COLUMN "claim_status";
  ALTER TABLE "businesses" DROP COLUMN "owner_id";
  ALTER TABLE "businesses" DROP COLUMN "nace_category";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_social_linkedin";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_social_tiktok";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_social_youtube";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_video";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_claim_status";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_owner_id";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_nace_category";
  DROP TYPE "public"."enum_businesses_claim_status";
  DROP TYPE "public"."enum_businesses_nace_category";
  DROP TYPE "public"."enum__businesses_v_version_claim_status";
  DROP TYPE "public"."enum__businesses_v_version_nace_category";`)
}
