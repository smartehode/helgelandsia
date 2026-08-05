import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "ai_sammendrag" varchar;
  ALTER TABLE "businesses" ADD COLUMN "ai_sammendrag_aar" numeric;
  ALTER TABLE "businesses" ADD COLUMN "ai_generert_dato" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_ai_sammendrag" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_ai_sammendrag_aar" numeric;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_ai_generert_dato" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP COLUMN "ai_sammendrag";
  ALTER TABLE "businesses" DROP COLUMN "ai_sammendrag_aar";
  ALTER TABLE "businesses" DROP COLUMN "ai_generert_dato";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_ai_sammendrag";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_ai_sammendrag_aar";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_ai_generert_dato";`)
}
