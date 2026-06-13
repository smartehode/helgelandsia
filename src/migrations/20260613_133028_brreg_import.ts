import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_brreg_entity_type" AS ENUM('hovedenhet', 'underenhet');
  CREATE TYPE "public"."enum_businesses_brreg_status" AS ENUM('aktiv', 'underAvvikling', 'konkurs', 'slettet', 'fjernet');
  CREATE TYPE "public"."enum_businesses_source" AS ENUM('member', 'brreg');
  CREATE TYPE "public"."enum__businesses_v_version_brreg_entity_type" AS ENUM('hovedenhet', 'underenhet');
  CREATE TYPE "public"."enum__businesses_v_version_brreg_status" AS ENUM('aktiv', 'underAvvikling', 'konkurs', 'slettet', 'fjernet');
  CREATE TYPE "public"."enum__businesses_v_version_source" AS ENUM('member', 'brreg');
  CREATE TYPE "public"."enum_brreg_sync_jobs_sync_type" AS ENUM('full', 'incremental');
  CREATE TYPE "public"."enum_brreg_sync_jobs_status" AS ENUM('success', 'partial', 'failed');
  CREATE TABLE "brreg_sync_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sync_type" "enum_brreg_sync_jobs_sync_type",
  	"status" "enum_brreg_sync_jobs_status",
  	"created" numeric DEFAULT 0,
  	"updated" numeric DEFAULT 0,
  	"skipped" numeric DEFAULT 0,
  	"errors" numeric DEFAULT 0,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "brreg_last_synced" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "brreg_entity_type" "enum_businesses_brreg_entity_type";
  ALTER TABLE "businesses" ADD COLUMN "brreg_status" "enum_businesses_brreg_status";
  ALTER TABLE "businesses" ADD COLUMN "parent_orgnr" varchar;
  ALTER TABLE "businesses" ADD COLUMN "nace_kode" varchar;
  ALTER TABLE "businesses" ADD COLUMN "nace_beskrivelse" varchar;
  ALTER TABLE "businesses" ADD COLUMN "organisasjonsform" varchar;
  ALTER TABLE "businesses" ADD COLUMN "kommunenummer" varchar;
  ALTER TABLE "businesses" ADD COLUMN "kommunenavn" varchar;
  ALTER TABLE "businesses" ADD COLUMN "registreringsdato" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "avregistreringsdato" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "antall_ansatte" numeric;
  ALTER TABLE "businesses" ADD COLUMN "orgnr" varchar;
  ALTER TABLE "businesses" ADD COLUMN "source" "enum_businesses_source" DEFAULT 'member';
  ALTER TABLE "businesses" ADD COLUMN "claimed" boolean DEFAULT false;
  ALTER TABLE "businesses" ADD COLUMN "claimed_by_id" integer;
  ALTER TABLE "businesses" ADD COLUMN "claimed_at" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_brreg_last_synced" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_brreg_entity_type" "enum__businesses_v_version_brreg_entity_type";
  ALTER TABLE "_businesses_v" ADD COLUMN "version_brreg_status" "enum__businesses_v_version_brreg_status";
  ALTER TABLE "_businesses_v" ADD COLUMN "version_parent_orgnr" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_nace_kode" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_nace_beskrivelse" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_organisasjonsform" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_kommunenummer" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_kommunenavn" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_registreringsdato" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_avregistreringsdato" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_antall_ansatte" numeric;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_orgnr" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_source" "enum__businesses_v_version_source" DEFAULT 'member';
  ALTER TABLE "_businesses_v" ADD COLUMN "version_claimed" boolean DEFAULT false;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_claimed_by_id" integer;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_claimed_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brreg_sync_jobs_id" integer;
  CREATE INDEX "brreg_sync_jobs_updated_at_idx" ON "brreg_sync_jobs" USING btree ("updated_at");
  CREATE INDEX "brreg_sync_jobs_created_at_idx" ON "brreg_sync_jobs" USING btree ("created_at");
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_claimed_by_id_members_id_fk" FOREIGN KEY ("claimed_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_businesses_v" ADD CONSTRAINT "_businesses_v_version_claimed_by_id_members_id_fk" FOREIGN KEY ("version_claimed_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brreg_sync_jobs_fk" FOREIGN KEY ("brreg_sync_jobs_id") REFERENCES "public"."brreg_sync_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "businesses_orgnr_idx" ON "businesses" USING btree ("orgnr");
  CREATE INDEX "businesses_claimed_by_idx" ON "businesses" USING btree ("claimed_by_id");
  CREATE INDEX "_businesses_v_version_version_orgnr_idx" ON "_businesses_v" USING btree ("version_orgnr");
  CREATE INDEX "_businesses_v_version_version_claimed_by_idx" ON "_businesses_v" USING btree ("version_claimed_by_id");
  CREATE INDEX "payload_locked_documents_rels_brreg_sync_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("brreg_sync_jobs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brreg_sync_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brreg_sync_jobs" CASCADE;
  ALTER TABLE "businesses" DROP CONSTRAINT "businesses_claimed_by_id_members_id_fk";
  
  ALTER TABLE "_businesses_v" DROP CONSTRAINT "_businesses_v_version_claimed_by_id_members_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brreg_sync_jobs_fk";
  
  DROP INDEX "businesses_orgnr_idx";
  DROP INDEX "businesses_claimed_by_idx";
  DROP INDEX "_businesses_v_version_version_orgnr_idx";
  DROP INDEX "_businesses_v_version_version_claimed_by_idx";
  DROP INDEX "payload_locked_documents_rels_brreg_sync_jobs_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "brreg_last_synced";
  ALTER TABLE "businesses" DROP COLUMN "brreg_entity_type";
  ALTER TABLE "businesses" DROP COLUMN "brreg_status";
  ALTER TABLE "businesses" DROP COLUMN "parent_orgnr";
  ALTER TABLE "businesses" DROP COLUMN "nace_kode";
  ALTER TABLE "businesses" DROP COLUMN "nace_beskrivelse";
  ALTER TABLE "businesses" DROP COLUMN "organisasjonsform";
  ALTER TABLE "businesses" DROP COLUMN "kommunenummer";
  ALTER TABLE "businesses" DROP COLUMN "kommunenavn";
  ALTER TABLE "businesses" DROP COLUMN "registreringsdato";
  ALTER TABLE "businesses" DROP COLUMN "avregistreringsdato";
  ALTER TABLE "businesses" DROP COLUMN "antall_ansatte";
  ALTER TABLE "businesses" DROP COLUMN "orgnr";
  ALTER TABLE "businesses" DROP COLUMN "source";
  ALTER TABLE "businesses" DROP COLUMN "claimed";
  ALTER TABLE "businesses" DROP COLUMN "claimed_by_id";
  ALTER TABLE "businesses" DROP COLUMN "claimed_at";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_brreg_last_synced";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_brreg_entity_type";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_brreg_status";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_parent_orgnr";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_nace_kode";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_nace_beskrivelse";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_organisasjonsform";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_kommunenummer";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_kommunenavn";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_registreringsdato";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_avregistreringsdato";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_antall_ansatte";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_orgnr";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_source";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_claimed";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_claimed_by_id";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_claimed_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brreg_sync_jobs_id";
  DROP TYPE "public"."enum_businesses_brreg_entity_type";
  DROP TYPE "public"."enum_businesses_brreg_status";
  DROP TYPE "public"."enum_businesses_source";
  DROP TYPE "public"."enum__businesses_v_version_brreg_entity_type";
  DROP TYPE "public"."enum__businesses_v_version_brreg_status";
  DROP TYPE "public"."enum__businesses_v_version_source";
  DROP TYPE "public"."enum_brreg_sync_jobs_sync_type";
  DROP TYPE "public"."enum_brreg_sync_jobs_status";`)
}
