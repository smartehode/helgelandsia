import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "city" varchar;
  ALTER TABLE "businesses" ADD COLUMN "county" varchar;
  ALTER TABLE "businesses" ADD COLUMN "country" varchar DEFAULT 'Norge';
  ALTER TABLE "businesses" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_city" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_county" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_country" varchar DEFAULT 'Norge';
  ALTER TABLE "_businesses_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_submitted_by_id_members_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_businesses_v" ADD CONSTRAINT "_businesses_v_version_submitted_by_id_members_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "businesses_submitted_by_idx" ON "businesses" USING btree ("submitted_by_id");
  CREATE INDEX "_businesses_v_version_version_submitted_by_idx" ON "_businesses_v" USING btree ("version_submitted_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP CONSTRAINT "businesses_submitted_by_id_members_id_fk";
  
  ALTER TABLE "_businesses_v" DROP CONSTRAINT "_businesses_v_version_submitted_by_id_members_id_fk";
  
  DROP INDEX "businesses_submitted_by_idx";
  DROP INDEX "_businesses_v_version_version_submitted_by_idx";
  ALTER TABLE "businesses" DROP COLUMN "city";
  ALTER TABLE "businesses" DROP COLUMN "county";
  ALTER TABLE "businesses" DROP COLUMN "country";
  ALTER TABLE "businesses" DROP COLUMN "submitted_by_id";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_city";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_county";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_country";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_submitted_by_id";`)
}
