import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_eksterne_artikler_source" AS ENUM('api', 'manual', 'begge');
  CREATE TYPE "public"."enum_pages_blocks_eksterne_artikler_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_eksterne_artikler_bredde" AS ENUM('1', '2', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_eksterne_artikler_source" AS ENUM('api', 'manual', 'begge');
  CREATE TYPE "public"."enum__pages_v_blocks_eksterne_artikler_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_eksterne_artikler_bredde" AS ENUM('1', '2', 'full');
  CREATE TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_source" AS ENUM('api', 'manual', 'begge');
  CREATE TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_bredde" AS ENUM('1', '2', 'full');
  CREATE TABLE "pages_blocks_eksterne_artikler_manual_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_eksterne_artikler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source" "enum_pages_blocks_eksterne_artikler_source" DEFAULT 'api',
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_eksterne_artikler_variant" DEFAULT 'full',
  	"bredde" "enum_pages_blocks_eksterne_artikler_bredde" DEFAULT '1',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_eksterne_artikler_manual_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_eksterne_artikler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source" "enum__pages_v_blocks_eksterne_artikler_source" DEFAULT 'api',
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_eksterne_artikler_variant" DEFAULT 'full',
  	"bredde" "enum__pages_v_blocks_eksterne_artikler_bredde" DEFAULT '1',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_eksterne_artikler_manual_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "sidefelt_blocks_eksterne_artikler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source" "enum_sidefelt_blocks_eksterne_artikler_source" DEFAULT 'api',
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_eksterne_artikler_variant" DEFAULT 'full',
  	"bredde" "enum_sidefelt_blocks_eksterne_artikler_bredde" DEFAULT '1',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_eksterne_artikler_manual_urls" ADD CONSTRAINT "pages_blocks_eksterne_artikler_manual_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_eksterne_artikler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_eksterne_artikler" ADD CONSTRAINT "pages_blocks_eksterne_artikler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_eksterne_artikler_manual_urls" ADD CONSTRAINT "_pages_v_blocks_eksterne_artikler_manual_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_eksterne_artikler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_eksterne_artikler" ADD CONSTRAINT "_pages_v_blocks_eksterne_artikler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_eksterne_artikler_manual_urls" ADD CONSTRAINT "sidefelt_blocks_eksterne_artikler_manual_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt_blocks_eksterne_artikler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_eksterne_artikler" ADD CONSTRAINT "sidefelt_blocks_eksterne_artikler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_eksterne_artikler_manual_urls_order_idx" ON "pages_blocks_eksterne_artikler_manual_urls" USING btree ("_order");
  CREATE INDEX "pages_blocks_eksterne_artikler_manual_urls_parent_id_idx" ON "pages_blocks_eksterne_artikler_manual_urls" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_eksterne_artikler_order_idx" ON "pages_blocks_eksterne_artikler" USING btree ("_order");
  CREATE INDEX "pages_blocks_eksterne_artikler_parent_id_idx" ON "pages_blocks_eksterne_artikler" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_eksterne_artikler_path_idx" ON "pages_blocks_eksterne_artikler" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_eksterne_artikler_manual_urls_order_idx" ON "_pages_v_blocks_eksterne_artikler_manual_urls" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_eksterne_artikler_manual_urls_parent_id_idx" ON "_pages_v_blocks_eksterne_artikler_manual_urls" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_eksterne_artikler_order_idx" ON "_pages_v_blocks_eksterne_artikler" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_eksterne_artikler_parent_id_idx" ON "_pages_v_blocks_eksterne_artikler" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_eksterne_artikler_path_idx" ON "_pages_v_blocks_eksterne_artikler" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_eksterne_artikler_manual_urls_order_idx" ON "sidefelt_blocks_eksterne_artikler_manual_urls" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_eksterne_artikler_manual_urls_parent_id_idx" ON "sidefelt_blocks_eksterne_artikler_manual_urls" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_eksterne_artikler_order_idx" ON "sidefelt_blocks_eksterne_artikler" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_eksterne_artikler_parent_id_idx" ON "sidefelt_blocks_eksterne_artikler" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_eksterne_artikler_path_idx" ON "sidefelt_blocks_eksterne_artikler" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_eksterne_artikler_manual_urls" CASCADE;
  DROP TABLE "pages_blocks_eksterne_artikler" CASCADE;
  DROP TABLE "_pages_v_blocks_eksterne_artikler_manual_urls" CASCADE;
  DROP TABLE "_pages_v_blocks_eksterne_artikler" CASCADE;
  DROP TABLE "sidefelt_blocks_eksterne_artikler_manual_urls" CASCADE;
  DROP TABLE "sidefelt_blocks_eksterne_artikler" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_eksterne_artikler_source";
  DROP TYPE "public"."enum_pages_blocks_eksterne_artikler_variant";
  DROP TYPE "public"."enum_pages_blocks_eksterne_artikler_bredde";
  DROP TYPE "public"."enum__pages_v_blocks_eksterne_artikler_source";
  DROP TYPE "public"."enum__pages_v_blocks_eksterne_artikler_variant";
  DROP TYPE "public"."enum__pages_v_blocks_eksterne_artikler_bredde";
  DROP TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_source";
  DROP TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_eksterne_artikler_bredde";`)
}
