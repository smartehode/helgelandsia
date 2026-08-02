import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_oppdrag_kategori" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  CREATE TYPE "public"."enum_oppdrag_kommune" AS ENUM('alstahaug', 'bindal', 'brønnøy', 'dønna', 'grane', 'hattfjelldal', 'hemnes', 'herøy', 'leirfjord', 'lurøy', 'nesna', 'rana', 'rødøy', 'sømna', 'træna', 'vefsn', 'vega', 'vevelstad');
  CREATE TYPE "public"."enum_oppdrag_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__oppdrag_v_version_kategori" AS ENUM('bygg', 'handel', 'restaurant', 'transport', 'havbruk', 'landbruk', 'industri', 'tjenester', 'helse', 'utdanning', 'kultur', 'eiendom', 'forening', 'energi', 'annet');
  CREATE TYPE "public"."enum__oppdrag_v_version_kommune" AS ENUM('alstahaug', 'bindal', 'brønnøy', 'dønna', 'grane', 'hattfjelldal', 'hemnes', 'herøy', 'leirfjord', 'lurøy', 'nesna', 'rana', 'rødøy', 'sømna', 'træna', 'vefsn', 'vega', 'vevelstad');
  CREATE TYPE "public"."enum__oppdrag_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "oppdrag_interessert" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"bedrift_id" integer
  );
  
  CREATE TABLE "oppdrag" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"submitted_by_id" integer,
  	"tittel" varchar,
  	"beskrivelse" varchar,
  	"kategori" "enum_oppdrag_kategori",
  	"kommune" "enum_oppdrag_kommune",
  	"onsket_tidsrom" varchar,
  	"kontakt_epost" varchar,
  	"kontakt_telefon" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_oppdrag_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_oppdrag_v_version_interessert" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"bedrift_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_oppdrag_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_submitted_by_id" integer,
  	"version_tittel" varchar,
  	"version_beskrivelse" varchar,
  	"version_kategori" "enum__oppdrag_v_version_kategori",
  	"version_kommune" "enum__oppdrag_v_version_kommune",
  	"version_onsket_tidsrom" varchar,
  	"version_kontakt_epost" varchar,
  	"version_kontakt_telefon" varchar,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__oppdrag_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "businesses" ADD COLUMN "mottar_oppdrag" boolean DEFAULT false;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_mottar_oppdrag" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "oppdrag_id" integer;
  ALTER TABLE "oppdrag_interessert" ADD CONSTRAINT "oppdrag_interessert_bedrift_id_businesses_id_fk" FOREIGN KEY ("bedrift_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "oppdrag_interessert" ADD CONSTRAINT "oppdrag_interessert_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."oppdrag"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "oppdrag" ADD CONSTRAINT "oppdrag_submitted_by_id_members_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_oppdrag_v_version_interessert" ADD CONSTRAINT "_oppdrag_v_version_interessert_bedrift_id_businesses_id_fk" FOREIGN KEY ("bedrift_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_oppdrag_v_version_interessert" ADD CONSTRAINT "_oppdrag_v_version_interessert_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_oppdrag_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_oppdrag_v" ADD CONSTRAINT "_oppdrag_v_parent_id_oppdrag_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."oppdrag"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_oppdrag_v" ADD CONSTRAINT "_oppdrag_v_version_submitted_by_id_members_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "oppdrag_interessert_order_idx" ON "oppdrag_interessert" USING btree ("_order");
  CREATE INDEX "oppdrag_interessert_parent_id_idx" ON "oppdrag_interessert" USING btree ("_parent_id");
  CREATE INDEX "oppdrag_interessert_bedrift_idx" ON "oppdrag_interessert" USING btree ("bedrift_id");
  CREATE INDEX "oppdrag_submitted_by_idx" ON "oppdrag" USING btree ("submitted_by_id");
  CREATE UNIQUE INDEX "oppdrag_slug_idx" ON "oppdrag" USING btree ("slug");
  CREATE INDEX "oppdrag_updated_at_idx" ON "oppdrag" USING btree ("updated_at");
  CREATE INDEX "oppdrag_created_at_idx" ON "oppdrag" USING btree ("created_at");
  CREATE INDEX "oppdrag__status_idx" ON "oppdrag" USING btree ("_status");
  CREATE INDEX "_oppdrag_v_version_interessert_order_idx" ON "_oppdrag_v_version_interessert" USING btree ("_order");
  CREATE INDEX "_oppdrag_v_version_interessert_parent_id_idx" ON "_oppdrag_v_version_interessert" USING btree ("_parent_id");
  CREATE INDEX "_oppdrag_v_version_interessert_bedrift_idx" ON "_oppdrag_v_version_interessert" USING btree ("bedrift_id");
  CREATE INDEX "_oppdrag_v_parent_idx" ON "_oppdrag_v" USING btree ("parent_id");
  CREATE INDEX "_oppdrag_v_version_version_submitted_by_idx" ON "_oppdrag_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_oppdrag_v_version_version_slug_idx" ON "_oppdrag_v" USING btree ("version_slug");
  CREATE INDEX "_oppdrag_v_version_version_updated_at_idx" ON "_oppdrag_v" USING btree ("version_updated_at");
  CREATE INDEX "_oppdrag_v_version_version_created_at_idx" ON "_oppdrag_v" USING btree ("version_created_at");
  CREATE INDEX "_oppdrag_v_version_version__status_idx" ON "_oppdrag_v" USING btree ("version__status");
  CREATE INDEX "_oppdrag_v_created_at_idx" ON "_oppdrag_v" USING btree ("created_at");
  CREATE INDEX "_oppdrag_v_updated_at_idx" ON "_oppdrag_v" USING btree ("updated_at");
  CREATE INDEX "_oppdrag_v_latest_idx" ON "_oppdrag_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_oppdrag_fk" FOREIGN KEY ("oppdrag_id") REFERENCES "public"."oppdrag"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_oppdrag_id_idx" ON "payload_locked_documents_rels" USING btree ("oppdrag_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oppdrag_interessert" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "oppdrag" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oppdrag_v_version_interessert" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oppdrag_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "oppdrag_interessert" CASCADE;
  DROP TABLE "oppdrag" CASCADE;
  DROP TABLE "_oppdrag_v_version_interessert" CASCADE;
  DROP TABLE "_oppdrag_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_oppdrag_fk";
  
  DROP INDEX "payload_locked_documents_rels_oppdrag_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "mottar_oppdrag";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_mottar_oppdrag";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "oppdrag_id";
  DROP TYPE "public"."enum_oppdrag_kategori";
  DROP TYPE "public"."enum_oppdrag_kommune";
  DROP TYPE "public"."enum_oppdrag_status";
  DROP TYPE "public"."enum__oppdrag_v_version_kategori";
  DROP TYPE "public"."enum__oppdrag_v_version_kommune";
  DROP TYPE "public"."enum__oppdrag_v_version_status";`)
}
