import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_flights_airports" AS ENUM('BNN', 'SSJ', 'MJF');
  CREATE TYPE "public"."enum_pages_blocks_flights_direction" AS ENUM('departure', 'arrival', 'begge');
  CREATE TYPE "public"."enum_pages_blocks_flights_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_nav_jobs_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_news_sources" AS ENUM('BAnett', 'Helgelendingen', 'Helgelands Blad', 'NRK Nordland');
  CREATE TYPE "public"."enum_pages_blocks_news_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_brreg_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_flights_airports" AS ENUM('BNN', 'SSJ', 'MJF');
  CREATE TYPE "public"."enum__pages_v_blocks_flights_direction" AS ENUM('departure', 'arrival', 'begge');
  CREATE TYPE "public"."enum__pages_v_blocks_flights_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_nav_jobs_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_news_sources" AS ENUM('BAnett', 'Helgelendingen', 'Helgelands Blad', 'NRK Nordland');
  CREATE TYPE "public"."enum__pages_v_blocks_news_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_brreg_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_flights_airports" AS ENUM('BNN', 'SSJ', 'MJF');
  CREATE TYPE "public"."enum_sidefelt_blocks_flights_direction" AS ENUM('departure', 'arrival', 'begge');
  CREATE TYPE "public"."enum_sidefelt_blocks_flights_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_nav_jobs_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_news_sources" AS ENUM('BAnett', 'Helgelendingen', 'Helgelands Blad', 'NRK Nordland');
  CREATE TYPE "public"."enum_sidefelt_blocks_news_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_brreg_variant" AS ENUM('full', 'kompakt');
  CREATE TABLE "pages_blocks_flights_airports" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_flights_airports",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_flights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"direction" "enum_pages_blocks_flights_direction" DEFAULT 'departure',
  	"count" numeric DEFAULT 4,
  	"variant" "enum_pages_blocks_flights_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_nav_jobs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 6,
  	"variant" "enum_pages_blocks_nav_jobs_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_news_sources" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_news_sources",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum_pages_blocks_news_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_brreg" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_brreg_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_flights_airports" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_flights_airports",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_flights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"direction" "enum__pages_v_blocks_flights_direction" DEFAULT 'departure',
  	"count" numeric DEFAULT 4,
  	"variant" "enum__pages_v_blocks_flights_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_nav_jobs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 6,
  	"variant" "enum__pages_v_blocks_nav_jobs_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_news_sources" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_news_sources",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum__pages_v_blocks_news_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_brreg" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_brreg_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_flights_airports" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_sidefelt_blocks_flights_airports",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_flights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"direction" "enum_sidefelt_blocks_flights_direction" DEFAULT 'departure',
  	"count" numeric DEFAULT 4,
  	"variant" "enum_sidefelt_blocks_flights_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_nav_jobs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 6,
  	"variant" "enum_sidefelt_blocks_nav_jobs_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_news_sources" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_sidefelt_blocks_news_sources",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 8,
  	"variant" "enum_sidefelt_blocks_news_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_brreg" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_brreg_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_flights_airports" ADD CONSTRAINT "pages_blocks_flights_airports_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_flights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flights" ADD CONSTRAINT "pages_blocks_flights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_nav_jobs" ADD CONSTRAINT "pages_blocks_nav_jobs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_news_sources" ADD CONSTRAINT "pages_blocks_news_sources_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_news" ADD CONSTRAINT "pages_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_brreg" ADD CONSTRAINT "pages_blocks_brreg_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flights_airports" ADD CONSTRAINT "_pages_v_blocks_flights_airports_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_flights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flights" ADD CONSTRAINT "_pages_v_blocks_flights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_nav_jobs" ADD CONSTRAINT "_pages_v_blocks_nav_jobs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news_sources" ADD CONSTRAINT "_pages_v_blocks_news_sources_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news" ADD CONSTRAINT "_pages_v_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_brreg" ADD CONSTRAINT "_pages_v_blocks_brreg_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_flights_airports" ADD CONSTRAINT "sidefelt_blocks_flights_airports_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt_blocks_flights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_flights" ADD CONSTRAINT "sidefelt_blocks_flights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_nav_jobs" ADD CONSTRAINT "sidefelt_blocks_nav_jobs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_news_sources" ADD CONSTRAINT "sidefelt_blocks_news_sources_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_news" ADD CONSTRAINT "sidefelt_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_brreg" ADD CONSTRAINT "sidefelt_blocks_brreg_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_flights_airports_order_idx" ON "pages_blocks_flights_airports" USING btree ("order");
  CREATE INDEX "pages_blocks_flights_airports_parent_idx" ON "pages_blocks_flights_airports" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_flights_order_idx" ON "pages_blocks_flights" USING btree ("_order");
  CREATE INDEX "pages_blocks_flights_parent_id_idx" ON "pages_blocks_flights" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flights_path_idx" ON "pages_blocks_flights" USING btree ("_path");
  CREATE INDEX "pages_blocks_nav_jobs_order_idx" ON "pages_blocks_nav_jobs" USING btree ("_order");
  CREATE INDEX "pages_blocks_nav_jobs_parent_id_idx" ON "pages_blocks_nav_jobs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_nav_jobs_path_idx" ON "pages_blocks_nav_jobs" USING btree ("_path");
  CREATE INDEX "pages_blocks_news_sources_order_idx" ON "pages_blocks_news_sources" USING btree ("order");
  CREATE INDEX "pages_blocks_news_sources_parent_idx" ON "pages_blocks_news_sources" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_news_order_idx" ON "pages_blocks_news" USING btree ("_order");
  CREATE INDEX "pages_blocks_news_parent_id_idx" ON "pages_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_news_path_idx" ON "pages_blocks_news" USING btree ("_path");
  CREATE INDEX "pages_blocks_brreg_order_idx" ON "pages_blocks_brreg" USING btree ("_order");
  CREATE INDEX "pages_blocks_brreg_parent_id_idx" ON "pages_blocks_brreg" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_brreg_path_idx" ON "pages_blocks_brreg" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_flights_airports_order_idx" ON "_pages_v_blocks_flights_airports" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_flights_airports_parent_idx" ON "_pages_v_blocks_flights_airports" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_flights_order_idx" ON "_pages_v_blocks_flights" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_flights_parent_id_idx" ON "_pages_v_blocks_flights" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_flights_path_idx" ON "_pages_v_blocks_flights" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_nav_jobs_order_idx" ON "_pages_v_blocks_nav_jobs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_nav_jobs_parent_id_idx" ON "_pages_v_blocks_nav_jobs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_nav_jobs_path_idx" ON "_pages_v_blocks_nav_jobs" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_news_sources_order_idx" ON "_pages_v_blocks_news_sources" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_news_sources_parent_idx" ON "_pages_v_blocks_news_sources" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_news_order_idx" ON "_pages_v_blocks_news" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_news_parent_id_idx" ON "_pages_v_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_news_path_idx" ON "_pages_v_blocks_news" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_brreg_order_idx" ON "_pages_v_blocks_brreg" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_brreg_parent_id_idx" ON "_pages_v_blocks_brreg" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_brreg_path_idx" ON "_pages_v_blocks_brreg" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_flights_airports_order_idx" ON "sidefelt_blocks_flights_airports" USING btree ("order");
  CREATE INDEX "sidefelt_blocks_flights_airports_parent_idx" ON "sidefelt_blocks_flights_airports" USING btree ("parent_id");
  CREATE INDEX "sidefelt_blocks_flights_order_idx" ON "sidefelt_blocks_flights" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_flights_parent_id_idx" ON "sidefelt_blocks_flights" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_flights_path_idx" ON "sidefelt_blocks_flights" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_nav_jobs_order_idx" ON "sidefelt_blocks_nav_jobs" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_nav_jobs_parent_id_idx" ON "sidefelt_blocks_nav_jobs" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_nav_jobs_path_idx" ON "sidefelt_blocks_nav_jobs" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_news_sources_order_idx" ON "sidefelt_blocks_news_sources" USING btree ("order");
  CREATE INDEX "sidefelt_blocks_news_sources_parent_idx" ON "sidefelt_blocks_news_sources" USING btree ("parent_id");
  CREATE INDEX "sidefelt_blocks_news_order_idx" ON "sidefelt_blocks_news" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_news_parent_id_idx" ON "sidefelt_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_news_path_idx" ON "sidefelt_blocks_news" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_brreg_order_idx" ON "sidefelt_blocks_brreg" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_brreg_parent_id_idx" ON "sidefelt_blocks_brreg" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_brreg_path_idx" ON "sidefelt_blocks_brreg" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_flights_airports" CASCADE;
  DROP TABLE "pages_blocks_flights" CASCADE;
  DROP TABLE "pages_blocks_nav_jobs" CASCADE;
  DROP TABLE "pages_blocks_news_sources" CASCADE;
  DROP TABLE "pages_blocks_news" CASCADE;
  DROP TABLE "pages_blocks_brreg" CASCADE;
  DROP TABLE "_pages_v_blocks_flights_airports" CASCADE;
  DROP TABLE "_pages_v_blocks_flights" CASCADE;
  DROP TABLE "_pages_v_blocks_nav_jobs" CASCADE;
  DROP TABLE "_pages_v_blocks_news_sources" CASCADE;
  DROP TABLE "_pages_v_blocks_news" CASCADE;
  DROP TABLE "_pages_v_blocks_brreg" CASCADE;
  DROP TABLE "sidefelt_blocks_flights_airports" CASCADE;
  DROP TABLE "sidefelt_blocks_flights" CASCADE;
  DROP TABLE "sidefelt_blocks_nav_jobs" CASCADE;
  DROP TABLE "sidefelt_blocks_news_sources" CASCADE;
  DROP TABLE "sidefelt_blocks_news" CASCADE;
  DROP TABLE "sidefelt_blocks_brreg" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_flights_airports";
  DROP TYPE "public"."enum_pages_blocks_flights_direction";
  DROP TYPE "public"."enum_pages_blocks_flights_variant";
  DROP TYPE "public"."enum_pages_blocks_nav_jobs_variant";
  DROP TYPE "public"."enum_pages_blocks_news_sources";
  DROP TYPE "public"."enum_pages_blocks_news_variant";
  DROP TYPE "public"."enum_pages_blocks_brreg_variant";
  DROP TYPE "public"."enum__pages_v_blocks_flights_airports";
  DROP TYPE "public"."enum__pages_v_blocks_flights_direction";
  DROP TYPE "public"."enum__pages_v_blocks_flights_variant";
  DROP TYPE "public"."enum__pages_v_blocks_nav_jobs_variant";
  DROP TYPE "public"."enum__pages_v_blocks_news_sources";
  DROP TYPE "public"."enum__pages_v_blocks_news_variant";
  DROP TYPE "public"."enum__pages_v_blocks_brreg_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_flights_airports";
  DROP TYPE "public"."enum_sidefelt_blocks_flights_direction";
  DROP TYPE "public"."enum_sidefelt_blocks_flights_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_nav_jobs_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_news_sources";
  DROP TYPE "public"."enum_sidefelt_blocks_news_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_brreg_variant";`)
}
