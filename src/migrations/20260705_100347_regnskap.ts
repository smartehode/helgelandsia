import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "regnskap" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"orgnr" varchar NOT NULL,
  	"aar" numeric NOT NULL,
  	"omsetning" numeric,
  	"driftsresultat" numeric,
  	"aarsresultat" numeric,
  	"egenkapital" numeric,
  	"valuta" varchar,
  	"hentet_dato" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "members" ADD COLUMN "anbudsvarsling" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "regnskap_id" integer;
  CREATE INDEX "regnskap_orgnr_idx" ON "regnskap" USING btree ("orgnr");
  CREATE INDEX "regnskap_aar_idx" ON "regnskap" USING btree ("aar");
  CREATE INDEX "regnskap_updated_at_idx" ON "regnskap" USING btree ("updated_at");
  CREATE INDEX "regnskap_created_at_idx" ON "regnskap" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regnskap_fk" FOREIGN KEY ("regnskap_id") REFERENCES "public"."regnskap"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_regnskap_id_idx" ON "payload_locked_documents_rels" USING btree ("regnskap_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "regnskap" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "regnskap" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_regnskap_fk";
  
  DROP INDEX "payload_locked_documents_rels_regnskap_id_idx";
  ALTER TABLE "members" DROP COLUMN "anbudsvarsling";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "regnskap_id";`)
}
