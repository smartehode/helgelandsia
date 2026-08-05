import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "formaal" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_formaal" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP COLUMN "formaal";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_formaal";`)
}
