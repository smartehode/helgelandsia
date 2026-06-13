import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_power_prices_zone" AS ENUM('NO1', 'NO2', 'NO3', 'NO4', 'NO5');
  CREATE TYPE "public"."enum_pages_blocks_power_prices_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_weather_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_power_prices_zone" AS ENUM('NO1', 'NO2', 'NO3', 'NO4', 'NO5');
  CREATE TYPE "public"."enum__pages_v_blocks_power_prices_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_weather_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_power_prices_zone" AS ENUM('NO1', 'NO2', 'NO3', 'NO4', 'NO5');
  CREATE TYPE "public"."enum_sidefelt_blocks_power_prices_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_weather_variant" AS ENUM('full', 'kompakt');
  CREATE TABLE "pages_blocks_power_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"zone" "enum_pages_blocks_power_prices_zone" DEFAULT 'NO4',
  	"variant" "enum_pages_blocks_power_prices_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_weather_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"lat" numeric,
  	"lon" numeric
  );
  
  CREATE TABLE "pages_blocks_weather" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"days" numeric DEFAULT 4,
  	"variant" "enum_pages_blocks_weather_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_power_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"zone" "enum__pages_v_blocks_power_prices_zone" DEFAULT 'NO4',
  	"variant" "enum__pages_v_blocks_power_prices_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_weather_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"lat" numeric,
  	"lon" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_weather" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"days" numeric DEFAULT 4,
  	"variant" "enum__pages_v_blocks_weather_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_power_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"zone" "enum_sidefelt_blocks_power_prices_zone" DEFAULT 'NO4',
  	"variant" "enum_sidefelt_blocks_power_prices_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_weather_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"lat" numeric NOT NULL,
  	"lon" numeric NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_weather" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"days" numeric DEFAULT 4,
  	"variant" "enum_sidefelt_blocks_weather_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "sub" varchar;
  ALTER TABLE "pages_blocks_power_prices" ADD CONSTRAINT "pages_blocks_power_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_weather_locations" ADD CONSTRAINT "pages_blocks_weather_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_weather"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_weather" ADD CONSTRAINT "pages_blocks_weather_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_power_prices" ADD CONSTRAINT "_pages_v_blocks_power_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_weather_locations" ADD CONSTRAINT "_pages_v_blocks_weather_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_weather"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_weather" ADD CONSTRAINT "_pages_v_blocks_weather_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_power_prices" ADD CONSTRAINT "sidefelt_blocks_power_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_weather_locations" ADD CONSTRAINT "sidefelt_blocks_weather_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt_blocks_weather"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_weather" ADD CONSTRAINT "sidefelt_blocks_weather_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_power_prices_order_idx" ON "pages_blocks_power_prices" USING btree ("_order");
  CREATE INDEX "pages_blocks_power_prices_parent_id_idx" ON "pages_blocks_power_prices" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_power_prices_path_idx" ON "pages_blocks_power_prices" USING btree ("_path");
  CREATE INDEX "pages_blocks_weather_locations_order_idx" ON "pages_blocks_weather_locations" USING btree ("_order");
  CREATE INDEX "pages_blocks_weather_locations_parent_id_idx" ON "pages_blocks_weather_locations" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_weather_order_idx" ON "pages_blocks_weather" USING btree ("_order");
  CREATE INDEX "pages_blocks_weather_parent_id_idx" ON "pages_blocks_weather" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_weather_path_idx" ON "pages_blocks_weather" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_power_prices_order_idx" ON "_pages_v_blocks_power_prices" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_power_prices_parent_id_idx" ON "_pages_v_blocks_power_prices" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_power_prices_path_idx" ON "_pages_v_blocks_power_prices" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_weather_locations_order_idx" ON "_pages_v_blocks_weather_locations" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_weather_locations_parent_id_idx" ON "_pages_v_blocks_weather_locations" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_weather_order_idx" ON "_pages_v_blocks_weather" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_weather_parent_id_idx" ON "_pages_v_blocks_weather" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_weather_path_idx" ON "_pages_v_blocks_weather" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_power_prices_order_idx" ON "sidefelt_blocks_power_prices" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_power_prices_parent_id_idx" ON "sidefelt_blocks_power_prices" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_power_prices_path_idx" ON "sidefelt_blocks_power_prices" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_weather_locations_order_idx" ON "sidefelt_blocks_weather_locations" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_weather_locations_parent_id_idx" ON "sidefelt_blocks_weather_locations" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_weather_order_idx" ON "sidefelt_blocks_weather" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_weather_parent_id_idx" ON "sidefelt_blocks_weather" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_weather_path_idx" ON "sidefelt_blocks_weather" USING btree ("_path");
  CREATE INDEX "members_sub_idx" ON "members" USING btree ("sub");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_power_prices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_weather_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_weather" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_power_prices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_weather_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_weather" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sidefelt_blocks_power_prices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sidefelt_blocks_weather_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sidefelt_blocks_weather" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sidefelt" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_power_prices" CASCADE;
  DROP TABLE "pages_blocks_weather_locations" CASCADE;
  DROP TABLE "pages_blocks_weather" CASCADE;
  DROP TABLE "_pages_v_blocks_power_prices" CASCADE;
  DROP TABLE "_pages_v_blocks_weather_locations" CASCADE;
  DROP TABLE "_pages_v_blocks_weather" CASCADE;
  DROP TABLE "sidefelt_blocks_power_prices" CASCADE;
  DROP TABLE "sidefelt_blocks_weather_locations" CASCADE;
  DROP TABLE "sidefelt_blocks_weather" CASCADE;
  DROP TABLE "sidefelt" CASCADE;
  DROP INDEX "members_sub_idx";
  ALTER TABLE "members" DROP COLUMN "sub";
  DROP TYPE "public"."enum_pages_blocks_power_prices_zone";
  DROP TYPE "public"."enum_pages_blocks_power_prices_variant";
  DROP TYPE "public"."enum_pages_blocks_weather_variant";
  DROP TYPE "public"."enum__pages_v_blocks_power_prices_zone";
  DROP TYPE "public"."enum__pages_v_blocks_power_prices_variant";
  DROP TYPE "public"."enum__pages_v_blocks_weather_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_power_prices_zone";
  DROP TYPE "public"."enum_sidefelt_blocks_power_prices_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_weather_variant";`)
}
