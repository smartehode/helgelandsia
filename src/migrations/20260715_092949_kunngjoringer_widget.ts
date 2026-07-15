import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_pages_blocks_kunngjoringer_kommuner" AS ENUM('rana', 'hemnes', 'alstahaug'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum_pages_blocks_kunngjoringer_variant" AS ENUM('full', 'kompakt'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum_pages_blocks_kunngjoringer_bredde" AS ENUM('1', '2', 'full'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_kunngjoringer_kommuner" AS ENUM('rana', 'hemnes', 'alstahaug'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_kunngjoringer_variant" AS ENUM('full', 'kompakt'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_kunngjoringer_bredde" AS ENUM('1', '2', 'full'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum_sidefelt_blocks_kunngjoringer_kommuner" AS ENUM('rana', 'hemnes', 'alstahaug'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum_sidefelt_blocks_kunngjoringer_variant" AS ENUM('full', 'kompakt'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN CREATE TYPE "public"."enum_sidefelt_blocks_kunngjoringer_bredde" AS ENUM('1', '2', 'full'); EXCEPTION WHEN duplicate_object THEN null; END $$;
   CREATE TABLE IF NOT EXISTS "pages_blocks_kunngjoringer_kommuner" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_kunngjoringer_kommuner",
  	"id" serial PRIMARY KEY NOT NULL
   );
   CREATE TABLE IF NOT EXISTS "pages_blocks_kunngjoringer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum_pages_blocks_kunngjoringer_variant" DEFAULT 'full',
  	"bredde" "enum_pages_blocks_kunngjoringer_bredde" DEFAULT '1',
  	"block_name" varchar
   );
   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_kunngjoringer_kommuner" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_kunngjoringer_kommuner",
  	"id" serial PRIMARY KEY NOT NULL
   );
   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_kunngjoringer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum__pages_v_blocks_kunngjoringer_variant" DEFAULT 'full',
  	"bredde" "enum__pages_v_blocks_kunngjoringer_bredde" DEFAULT '1',
  	"_uuid" varchar,
  	"block_name" varchar
   );
   CREATE TABLE IF NOT EXISTS "sidefelt_blocks_kunngjoringer_kommuner" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_sidefelt_blocks_kunngjoringer_kommuner",
  	"id" serial PRIMARY KEY NOT NULL
   );
   CREATE TABLE IF NOT EXISTS "sidefelt_blocks_kunngjoringer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum_sidefelt_blocks_kunngjoringer_variant" DEFAULT 'full',
  	"bredde" "enum_sidefelt_blocks_kunngjoringer_bredde" DEFAULT '1',
  	"block_name" varchar
   );
   DO $$ BEGIN ALTER TABLE "pages_blocks_kunngjoringer_kommuner" ADD CONSTRAINT "pages_blocks_kunngjoringer_kommuner_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_kunngjoringer"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN ALTER TABLE "pages_blocks_kunngjoringer" ADD CONSTRAINT "pages_blocks_kunngjoringer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN ALTER TABLE "_pages_v_blocks_kunngjoringer_kommuner" ADD CONSTRAINT "_pages_v_blocks_kunngjoringer_kommuner_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_kunngjoringer"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN ALTER TABLE "_pages_v_blocks_kunngjoringer" ADD CONSTRAINT "_pages_v_blocks_kunngjoringer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN ALTER TABLE "sidefelt_blocks_kunngjoringer_kommuner" ADD CONSTRAINT "sidefelt_blocks_kunngjoringer_kommuner_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt_blocks_kunngjoringer"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   DO $$ BEGIN ALTER TABLE "sidefelt_blocks_kunngjoringer" ADD CONSTRAINT "sidefelt_blocks_kunngjoringer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
   CREATE INDEX IF NOT EXISTS "pages_blocks_kunngjoringer_kommuner_order_idx" ON "pages_blocks_kunngjoringer_kommuner" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_kunngjoringer_kommuner_parent_idx" ON "pages_blocks_kunngjoringer_kommuner" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_kunngjoringer_order_idx" ON "pages_blocks_kunngjoringer" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_kunngjoringer_parent_id_idx" ON "pages_blocks_kunngjoringer" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_kunngjoringer_path_idx" ON "pages_blocks_kunngjoringer" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_kunngjoringer_kommuner_order_idx" ON "_pages_v_blocks_kunngjoringer_kommuner" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_kunngjoringer_kommuner_parent_idx" ON "_pages_v_blocks_kunngjoringer_kommuner" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_kunngjoringer_order_idx" ON "_pages_v_blocks_kunngjoringer" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_kunngjoringer_parent_id_idx" ON "_pages_v_blocks_kunngjoringer" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_kunngjoringer_path_idx" ON "_pages_v_blocks_kunngjoringer" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "sidefelt_blocks_kunngjoringer_kommuner_order_idx" ON "sidefelt_blocks_kunngjoringer_kommuner" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "sidefelt_blocks_kunngjoringer_kommuner_parent_idx" ON "sidefelt_blocks_kunngjoringer_kommuner" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "sidefelt_blocks_kunngjoringer_order_idx" ON "sidefelt_blocks_kunngjoringer" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "sidefelt_blocks_kunngjoringer_parent_id_idx" ON "sidefelt_blocks_kunngjoringer" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "sidefelt_blocks_kunngjoringer_path_idx" ON "sidefelt_blocks_kunngjoringer" USING btree ("_path");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pages_blocks_kunngjoringer_kommuner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_kunngjoringer" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_kunngjoringer_kommuner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_kunngjoringer" CASCADE;
   DROP TABLE IF EXISTS "sidefelt_blocks_kunngjoringer_kommuner" CASCADE;
   DROP TABLE IF EXISTS "sidefelt_blocks_kunngjoringer" CASCADE;
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_kunngjoringer_kommuner";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_kunngjoringer_variant";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_kunngjoringer_bredde";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_kunngjoringer_kommuner";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_kunngjoringer_variant";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_kunngjoringer_bredde";
   DROP TYPE IF EXISTS "public"."enum_sidefelt_blocks_kunngjoringer_kommuner";
   DROP TYPE IF EXISTS "public"."enum_sidefelt_blocks_kunngjoringer_variant";
   DROP TYPE IF EXISTS "public"."enum_sidefelt_blocks_kunngjoringer_bredde";
  `)
}
