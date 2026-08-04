import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_abonnenter_status" AS ENUM('venter_bekreftelse', 'aktiv', 'avmeldt');
  CREATE TABLE "abonnenter" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"epost" varchar NOT NULL,
  	"status" "enum_abonnenter_status" DEFAULT 'venter_bekreftelse' NOT NULL,
  	"bekreft_token" varchar,
  	"avmeld_token" varchar,
  	"samtykke_tidspunkt" timestamp(3) with time zone,
  	"paameldt_fra" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "abonnenter_id" integer;
  CREATE UNIQUE INDEX "abonnenter_epost_idx" ON "abonnenter" USING btree ("epost");
  CREATE UNIQUE INDEX "abonnenter_bekreft_token_idx" ON "abonnenter" USING btree ("bekreft_token");
  CREATE UNIQUE INDEX "abonnenter_avmeld_token_idx" ON "abonnenter" USING btree ("avmeld_token");
  CREATE INDEX "abonnenter_updated_at_idx" ON "abonnenter" USING btree ("updated_at");
  CREATE INDEX "abonnenter_created_at_idx" ON "abonnenter" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_abonnenter_fk" FOREIGN KEY ("abonnenter_id") REFERENCES "public"."abonnenter"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_abonnenter_id_idx" ON "payload_locked_documents_rels" USING btree ("abonnenter_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "abonnenter" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "abonnenter" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_abonnenter_fk";
  
  DROP INDEX "payload_locked_documents_rels_abonnenter_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "abonnenter_id";
  DROP TYPE "public"."enum_abonnenter_status";`)
}
