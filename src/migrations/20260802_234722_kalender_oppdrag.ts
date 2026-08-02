import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_holidays" ADD COLUMN "show_oppdrag" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_holidays" ADD COLUMN "show_oppdrag" boolean DEFAULT true;
  ALTER TABLE "sidefelt_blocks_holidays" ADD COLUMN "show_oppdrag" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_holidays" DROP COLUMN "show_oppdrag";
  ALTER TABLE "_pages_v_blocks_holidays" DROP COLUMN "show_oppdrag";
  ALTER TABLE "sidefelt_blocks_holidays" DROP COLUMN "show_oppdrag";`)
}
