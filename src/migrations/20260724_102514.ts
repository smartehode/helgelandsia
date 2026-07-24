import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "press_releases" ADD COLUMN "bedrift_id" integer;
  ALTER TABLE "_press_releases_v" ADD COLUMN "version_bedrift_id" integer;
  ALTER TABLE "press_releases" ADD CONSTRAINT "press_releases_bedrift_id_businesses_id_fk" FOREIGN KEY ("bedrift_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_press_releases_v" ADD CONSTRAINT "_press_releases_v_version_bedrift_id_businesses_id_fk" FOREIGN KEY ("version_bedrift_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "press_releases_bedrift_idx" ON "press_releases" USING btree ("bedrift_id");
  CREATE INDEX "_press_releases_v_version_version_bedrift_idx" ON "_press_releases_v" USING btree ("version_bedrift_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "press_releases" DROP CONSTRAINT "press_releases_bedrift_id_businesses_id_fk";
  
  ALTER TABLE "_press_releases_v" DROP CONSTRAINT "_press_releases_v_version_bedrift_id_businesses_id_fk";
  
  DROP INDEX "press_releases_bedrift_idx";
  DROP INDEX "_press_releases_v_version_version_bedrift_idx";
  ALTER TABLE "press_releases" DROP COLUMN "bedrift_id";
  ALTER TABLE "_press_releases_v" DROP COLUMN "version_bedrift_id";`)
}
