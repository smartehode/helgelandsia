import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ALTER COLUMN "brreg_entity_type" SET DATA TYPE varchar;
  ALTER TABLE "_businesses_v" ALTER COLUMN "version_brreg_entity_type" SET DATA TYPE varchar;
  ALTER TABLE "businesses" ADD COLUMN "show_on_public_listing" boolean DEFAULT true;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_show_on_public_listing" boolean DEFAULT true;
  DROP TYPE "public"."enum_businesses_brreg_entity_type";
  DROP TYPE "public"."enum__businesses_v_version_brreg_entity_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_brreg_entity_type" AS ENUM('hovedenhet', 'underenhet');
  CREATE TYPE "public"."enum__businesses_v_version_brreg_entity_type" AS ENUM('hovedenhet', 'underenhet');
  ALTER TABLE "businesses" ALTER COLUMN "brreg_entity_type" SET DATA TYPE "public"."enum_businesses_brreg_entity_type" USING "brreg_entity_type"::"public"."enum_businesses_brreg_entity_type";
  ALTER TABLE "_businesses_v" ALTER COLUMN "version_brreg_entity_type" SET DATA TYPE "public"."enum__businesses_v_version_brreg_entity_type" USING "version_brreg_entity_type"::"public"."enum__businesses_v_version_brreg_entity_type";
  ALTER TABLE "businesses" DROP COLUMN "show_on_public_listing";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_show_on_public_listing";`)
}
