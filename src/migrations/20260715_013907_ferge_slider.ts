import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_ferge_stops" AS ENUM('NSR:StopPlace:49452', 'NSR:StopPlace:47666', 'NSR:StopPlace:59239', 'NSR:StopPlace:63216', 'NSR:StopPlace:47674', 'NSR:StopPlace:47440', 'NSR:StopPlace:48835', 'NSR:StopPlace:50291', 'NSR:StopPlace:47694');
  CREATE TYPE "public"."enum_pages_blocks_ferge_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_ferge_bredde" AS ENUM('1', '2', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_ferge_stops" AS ENUM('NSR:StopPlace:49452', 'NSR:StopPlace:47666', 'NSR:StopPlace:59239', 'NSR:StopPlace:63216', 'NSR:StopPlace:47674', 'NSR:StopPlace:47440', 'NSR:StopPlace:48835', 'NSR:StopPlace:50291', 'NSR:StopPlace:47694');
  CREATE TYPE "public"."enum__pages_v_blocks_ferge_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_ferge_bredde" AS ENUM('1', '2', 'full');
  CREATE TYPE "public"."enum_sidefelt_blocks_ferge_stops" AS ENUM('NSR:StopPlace:49452', 'NSR:StopPlace:47666', 'NSR:StopPlace:59239', 'NSR:StopPlace:63216', 'NSR:StopPlace:47674', 'NSR:StopPlace:47440', 'NSR:StopPlace:48835', 'NSR:StopPlace:50291', 'NSR:StopPlace:47694');
  CREATE TYPE "public"."enum_sidefelt_blocks_ferge_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_ferge_bredde" AS ENUM('1', '2', 'full');
  CREATE TABLE "pages_blocks_ferge_stops" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_ferge_stops",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_ferge" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_ferge_variant" DEFAULT 'full',
  	"bredde" "enum_pages_blocks_ferge_bredde" DEFAULT '1',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ferge_stops" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_ferge_stops",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_ferge" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_ferge_variant" DEFAULT 'full',
  	"bredde" "enum__pages_v_blocks_ferge_bredde" DEFAULT '1',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_ferge_stops" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_sidefelt_blocks_ferge_stops",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_ferge" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_ferge_variant" DEFAULT 'full',
  	"bredde" "enum_sidefelt_blocks_ferge_bredde" DEFAULT '1',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_ferge_stops" ADD CONSTRAINT "pages_blocks_ferge_stops_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_ferge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ferge" ADD CONSTRAINT "pages_blocks_ferge_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ferge_stops" ADD CONSTRAINT "_pages_v_blocks_ferge_stops_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_ferge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ferge" ADD CONSTRAINT "_pages_v_blocks_ferge_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_ferge_stops" ADD CONSTRAINT "sidefelt_blocks_ferge_stops_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt_blocks_ferge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_ferge" ADD CONSTRAINT "sidefelt_blocks_ferge_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_ferge_stops_order_idx" ON "pages_blocks_ferge_stops" USING btree ("order");
  CREATE INDEX "pages_blocks_ferge_stops_parent_idx" ON "pages_blocks_ferge_stops" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_ferge_order_idx" ON "pages_blocks_ferge" USING btree ("_order");
  CREATE INDEX "pages_blocks_ferge_parent_id_idx" ON "pages_blocks_ferge" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ferge_path_idx" ON "pages_blocks_ferge" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_ferge_stops_order_idx" ON "_pages_v_blocks_ferge_stops" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_ferge_stops_parent_idx" ON "_pages_v_blocks_ferge_stops" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_ferge_order_idx" ON "_pages_v_blocks_ferge" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ferge_parent_id_idx" ON "_pages_v_blocks_ferge" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ferge_path_idx" ON "_pages_v_blocks_ferge" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_ferge_stops_order_idx" ON "sidefelt_blocks_ferge_stops" USING btree ("order");
  CREATE INDEX "sidefelt_blocks_ferge_stops_parent_idx" ON "sidefelt_blocks_ferge_stops" USING btree ("parent_id");
  CREATE INDEX "sidefelt_blocks_ferge_order_idx" ON "sidefelt_blocks_ferge" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_ferge_parent_id_idx" ON "sidefelt_blocks_ferge" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_ferge_path_idx" ON "sidefelt_blocks_ferge" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_ferge_stops" CASCADE;
  DROP TABLE "pages_blocks_ferge" CASCADE;
  DROP TABLE "_pages_v_blocks_ferge_stops" CASCADE;
  DROP TABLE "_pages_v_blocks_ferge" CASCADE;
  DROP TABLE "sidefelt_blocks_ferge_stops" CASCADE;
  DROP TABLE "sidefelt_blocks_ferge" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_ferge_stops";
  DROP TYPE "public"."enum_pages_blocks_ferge_variant";
  DROP TYPE "public"."enum_pages_blocks_ferge_bredde";
  DROP TYPE "public"."enum__pages_v_blocks_ferge_stops";
  DROP TYPE "public"."enum__pages_v_blocks_ferge_variant";
  DROP TYPE "public"."enum__pages_v_blocks_ferge_bredde";
  DROP TYPE "public"."enum_sidefelt_blocks_ferge_stops";
  DROP TYPE "public"."enum_sidefelt_blocks_ferge_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_ferge_bredde";`)
}
