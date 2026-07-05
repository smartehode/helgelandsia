import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenders_status" AS ENUM('ACTIVE', 'EXPIRED', 'AWARDED', 'CANCELLED');
  CREATE TABLE "tenders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"doffin_id" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"buyer_name" varchar NOT NULL,
  	"buyer_org_nr" varchar,
  	"municipality" varchar,
  	"notice_type" varchar,
  	"status" "enum_tenders_status" NOT NULL,
  	"publication_date" timestamp(3) with time zone,
  	"deadline" timestamp(3) with time zone,
  	"cpv_hovedkode" varchar,
  	"cpv_tilleggskoder" jsonb,
  	"location_id" jsonb,
  	"place_of_performance" jsonb,
  	"doffin_url" varchar NOT NULL,
  	"last_synced" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenders_id" integer;
  CREATE UNIQUE INDEX "tenders_doffin_id_idx" ON "tenders" USING btree ("doffin_id");
  CREATE INDEX "tenders_municipality_idx" ON "tenders" USING btree ("municipality");
  CREATE INDEX "tenders_status_idx" ON "tenders" USING btree ("status");
  CREATE INDEX "tenders_cpv_hovedkode_idx" ON "tenders" USING btree ("cpv_hovedkode");
  CREATE INDEX "tenders_updated_at_idx" ON "tenders" USING btree ("updated_at");
  CREATE INDEX "tenders_created_at_idx" ON "tenders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenders_fk" FOREIGN KEY ("tenders_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tenders_id_idx" ON "payload_locked_documents_rels" USING btree ("tenders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenders" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenders_fk";
  
  DROP INDEX "payload_locked_documents_rels_tenders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tenders_id";
  DROP TYPE "public"."enum_tenders_status";`)
}
