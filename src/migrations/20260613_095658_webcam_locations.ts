import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_webcam_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_currency_show" AS ENUM('usd', 'eur', 'btc', 'brent');
  CREATE TYPE "public"."enum_pages_blocks_currency_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_holidays_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_webcam_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_currency_show" AS ENUM('usd', 'eur', 'btc', 'brent');
  CREATE TYPE "public"."enum__pages_v_blocks_currency_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_holidays_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_webcam_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_currency_show" AS ENUM('usd', 'eur', 'btc', 'brent');
  CREATE TYPE "public"."enum_sidefelt_blocks_currency_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_holidays_variant" AS ENUM('full', 'kompakt');
  CREATE TABLE "pages_blocks_webcam_locations_cameras" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"cam_title" varchar,
  	"source" varchar
  );
  
  CREATE TABLE "pages_blocks_webcam_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"lat" numeric,
  	"lng" numeric
  );
  
  CREATE TABLE "pages_blocks_webcam" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum_pages_blocks_webcam_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_currency_show" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_currency_show",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_currency" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum_pages_blocks_currency_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_holidays" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_holidays_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_webcam_locations_cameras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"cam_title" varchar,
  	"source" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_webcam_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_webcam" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum__pages_v_blocks_webcam_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_currency_show" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_currency_show",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_currency" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum__pages_v_blocks_currency_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_holidays" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_holidays_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_webcam_locations_cameras" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"cam_title" varchar NOT NULL,
  	"source" varchar NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_webcam_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"lat" numeric NOT NULL,
  	"lng" numeric NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_webcam" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum_sidefelt_blocks_webcam_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_currency_show" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_sidefelt_blocks_currency_show",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_currency" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant" "enum_sidefelt_blocks_currency_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_holidays" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_holidays_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_webcam_locations_cameras" ADD CONSTRAINT "pages_blocks_webcam_locations_cameras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_webcam_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_webcam_locations" ADD CONSTRAINT "pages_blocks_webcam_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_webcam"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_webcam" ADD CONSTRAINT "pages_blocks_webcam_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_currency_show" ADD CONSTRAINT "pages_blocks_currency_show_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_currency"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_currency" ADD CONSTRAINT "pages_blocks_currency_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_holidays" ADD CONSTRAINT "pages_blocks_holidays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_webcam_locations_cameras" ADD CONSTRAINT "_pages_v_blocks_webcam_locations_cameras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_webcam_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_webcam_locations" ADD CONSTRAINT "_pages_v_blocks_webcam_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_webcam"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_webcam" ADD CONSTRAINT "_pages_v_blocks_webcam_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_currency_show" ADD CONSTRAINT "_pages_v_blocks_currency_show_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_currency"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_currency" ADD CONSTRAINT "_pages_v_blocks_currency_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_holidays" ADD CONSTRAINT "_pages_v_blocks_holidays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_webcam_locations_cameras" ADD CONSTRAINT "sidefelt_blocks_webcam_locations_cameras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt_blocks_webcam_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_webcam_locations" ADD CONSTRAINT "sidefelt_blocks_webcam_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt_blocks_webcam"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_webcam" ADD CONSTRAINT "sidefelt_blocks_webcam_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_currency_show" ADD CONSTRAINT "sidefelt_blocks_currency_show_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt_blocks_currency"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_currency" ADD CONSTRAINT "sidefelt_blocks_currency_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_holidays" ADD CONSTRAINT "sidefelt_blocks_holidays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_webcam_locations_cameras_order_idx" ON "pages_blocks_webcam_locations_cameras" USING btree ("_order");
  CREATE INDEX "pages_blocks_webcam_locations_cameras_parent_id_idx" ON "pages_blocks_webcam_locations_cameras" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_webcam_locations_order_idx" ON "pages_blocks_webcam_locations" USING btree ("_order");
  CREATE INDEX "pages_blocks_webcam_locations_parent_id_idx" ON "pages_blocks_webcam_locations" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_webcam_order_idx" ON "pages_blocks_webcam" USING btree ("_order");
  CREATE INDEX "pages_blocks_webcam_parent_id_idx" ON "pages_blocks_webcam" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_webcam_path_idx" ON "pages_blocks_webcam" USING btree ("_path");
  CREATE INDEX "pages_blocks_currency_show_order_idx" ON "pages_blocks_currency_show" USING btree ("order");
  CREATE INDEX "pages_blocks_currency_show_parent_idx" ON "pages_blocks_currency_show" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_currency_order_idx" ON "pages_blocks_currency" USING btree ("_order");
  CREATE INDEX "pages_blocks_currency_parent_id_idx" ON "pages_blocks_currency" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_currency_path_idx" ON "pages_blocks_currency" USING btree ("_path");
  CREATE INDEX "pages_blocks_holidays_order_idx" ON "pages_blocks_holidays" USING btree ("_order");
  CREATE INDEX "pages_blocks_holidays_parent_id_idx" ON "pages_blocks_holidays" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_holidays_path_idx" ON "pages_blocks_holidays" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_webcam_locations_cameras_order_idx" ON "_pages_v_blocks_webcam_locations_cameras" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_webcam_locations_cameras_parent_id_idx" ON "_pages_v_blocks_webcam_locations_cameras" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_webcam_locations_order_idx" ON "_pages_v_blocks_webcam_locations" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_webcam_locations_parent_id_idx" ON "_pages_v_blocks_webcam_locations" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_webcam_order_idx" ON "_pages_v_blocks_webcam" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_webcam_parent_id_idx" ON "_pages_v_blocks_webcam" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_webcam_path_idx" ON "_pages_v_blocks_webcam" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_currency_show_order_idx" ON "_pages_v_blocks_currency_show" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_currency_show_parent_idx" ON "_pages_v_blocks_currency_show" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_currency_order_idx" ON "_pages_v_blocks_currency" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_currency_parent_id_idx" ON "_pages_v_blocks_currency" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_currency_path_idx" ON "_pages_v_blocks_currency" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_holidays_order_idx" ON "_pages_v_blocks_holidays" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_holidays_parent_id_idx" ON "_pages_v_blocks_holidays" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_holidays_path_idx" ON "_pages_v_blocks_holidays" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_webcam_locations_cameras_order_idx" ON "sidefelt_blocks_webcam_locations_cameras" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_webcam_locations_cameras_parent_id_idx" ON "sidefelt_blocks_webcam_locations_cameras" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_webcam_locations_order_idx" ON "sidefelt_blocks_webcam_locations" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_webcam_locations_parent_id_idx" ON "sidefelt_blocks_webcam_locations" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_webcam_order_idx" ON "sidefelt_blocks_webcam" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_webcam_parent_id_idx" ON "sidefelt_blocks_webcam" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_webcam_path_idx" ON "sidefelt_blocks_webcam" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_currency_show_order_idx" ON "sidefelt_blocks_currency_show" USING btree ("order");
  CREATE INDEX "sidefelt_blocks_currency_show_parent_idx" ON "sidefelt_blocks_currency_show" USING btree ("parent_id");
  CREATE INDEX "sidefelt_blocks_currency_order_idx" ON "sidefelt_blocks_currency" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_currency_parent_id_idx" ON "sidefelt_blocks_currency" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_currency_path_idx" ON "sidefelt_blocks_currency" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_holidays_order_idx" ON "sidefelt_blocks_holidays" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_holidays_parent_id_idx" ON "sidefelt_blocks_holidays" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_holidays_path_idx" ON "sidefelt_blocks_holidays" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_webcam_locations_cameras" CASCADE;
  DROP TABLE "pages_blocks_webcam_locations" CASCADE;
  DROP TABLE "pages_blocks_webcam" CASCADE;
  DROP TABLE "pages_blocks_currency_show" CASCADE;
  DROP TABLE "pages_blocks_currency" CASCADE;
  DROP TABLE "pages_blocks_holidays" CASCADE;
  DROP TABLE "_pages_v_blocks_webcam_locations_cameras" CASCADE;
  DROP TABLE "_pages_v_blocks_webcam_locations" CASCADE;
  DROP TABLE "_pages_v_blocks_webcam" CASCADE;
  DROP TABLE "_pages_v_blocks_currency_show" CASCADE;
  DROP TABLE "_pages_v_blocks_currency" CASCADE;
  DROP TABLE "_pages_v_blocks_holidays" CASCADE;
  DROP TABLE "sidefelt_blocks_webcam_locations_cameras" CASCADE;
  DROP TABLE "sidefelt_blocks_webcam_locations" CASCADE;
  DROP TABLE "sidefelt_blocks_webcam" CASCADE;
  DROP TABLE "sidefelt_blocks_currency_show" CASCADE;
  DROP TABLE "sidefelt_blocks_currency" CASCADE;
  DROP TABLE "sidefelt_blocks_holidays" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_webcam_variant";
  DROP TYPE "public"."enum_pages_blocks_currency_show";
  DROP TYPE "public"."enum_pages_blocks_currency_variant";
  DROP TYPE "public"."enum_pages_blocks_holidays_variant";
  DROP TYPE "public"."enum__pages_v_blocks_webcam_variant";
  DROP TYPE "public"."enum__pages_v_blocks_currency_show";
  DROP TYPE "public"."enum__pages_v_blocks_currency_variant";
  DROP TYPE "public"."enum__pages_v_blocks_holidays_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_webcam_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_currency_show";
  DROP TYPE "public"."enum_sidefelt_blocks_currency_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_holidays_variant";`)
}
