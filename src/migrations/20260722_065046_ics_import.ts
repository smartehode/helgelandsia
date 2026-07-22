import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "ics_uid" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_ics_uid" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP COLUMN "ics_uid";
  ALTER TABLE "_events_v" DROP COLUMN "version_ics_uid";`)
}
