import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_oppdrag_interessert_bransje" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  CREATE TYPE "public"."enum__oppdrag_v_version_interessert_bransje" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  ALTER TABLE "oppdrag_interessert" ADD COLUMN "bransje" "enum_oppdrag_interessert_bransje";
  ALTER TABLE "_oppdrag_v_version_interessert" ADD COLUMN "bransje" "enum__oppdrag_v_version_interessert_bransje";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oppdrag_interessert" DROP COLUMN "bransje";
  ALTER TABLE "_oppdrag_v_version_interessert" DROP COLUMN "bransje";
  DROP TYPE "public"."enum_oppdrag_interessert_bransje";
  DROP TYPE "public"."enum__oppdrag_v_version_interessert_bransje";`)
}
