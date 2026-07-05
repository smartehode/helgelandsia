import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_historier_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_pages_blocks_arrangementer_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_historier_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_arrangementer_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_historier_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_arrangementer_variant" AS ENUM('full', 'kompakt');
  CREATE TABLE "pages_blocks_historier" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 3,
  	"variant" "enum_pages_blocks_historier_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_arrangementer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_arrangementer_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_historier" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 3,
  	"variant" "enum__pages_v_blocks_historier_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_arrangementer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_arrangementer_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_historier" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 3,
  	"variant" "enum_sidefelt_blocks_historier_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_arrangementer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_arrangementer_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_historier" ADD CONSTRAINT "pages_blocks_historier_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_arrangementer" ADD CONSTRAINT "pages_blocks_arrangementer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_historier" ADD CONSTRAINT "_pages_v_blocks_historier_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_arrangementer" ADD CONSTRAINT "_pages_v_blocks_arrangementer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_historier" ADD CONSTRAINT "sidefelt_blocks_historier_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_arrangementer" ADD CONSTRAINT "sidefelt_blocks_arrangementer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_historier_order_idx" ON "pages_blocks_historier" USING btree ("_order");
  CREATE INDEX "pages_blocks_historier_parent_id_idx" ON "pages_blocks_historier" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_historier_path_idx" ON "pages_blocks_historier" USING btree ("_path");
  CREATE INDEX "pages_blocks_arrangementer_order_idx" ON "pages_blocks_arrangementer" USING btree ("_order");
  CREATE INDEX "pages_blocks_arrangementer_parent_id_idx" ON "pages_blocks_arrangementer" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_arrangementer_path_idx" ON "pages_blocks_arrangementer" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_historier_order_idx" ON "_pages_v_blocks_historier" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_historier_parent_id_idx" ON "_pages_v_blocks_historier" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_historier_path_idx" ON "_pages_v_blocks_historier" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_arrangementer_order_idx" ON "_pages_v_blocks_arrangementer" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_arrangementer_parent_id_idx" ON "_pages_v_blocks_arrangementer" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_arrangementer_path_idx" ON "_pages_v_blocks_arrangementer" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_historier_order_idx" ON "sidefelt_blocks_historier" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_historier_parent_id_idx" ON "sidefelt_blocks_historier" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_historier_path_idx" ON "sidefelt_blocks_historier" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_arrangementer_order_idx" ON "sidefelt_blocks_arrangementer" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_arrangementer_parent_id_idx" ON "sidefelt_blocks_arrangementer" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_arrangementer_path_idx" ON "sidefelt_blocks_arrangementer" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_historier" CASCADE;
  DROP TABLE "pages_blocks_arrangementer" CASCADE;
  DROP TABLE "_pages_v_blocks_historier" CASCADE;
  DROP TABLE "_pages_v_blocks_arrangementer" CASCADE;
  DROP TABLE "sidefelt_blocks_historier" CASCADE;
  DROP TABLE "sidefelt_blocks_arrangementer" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_historier_variant";
  DROP TYPE "public"."enum_pages_blocks_arrangementer_variant";
  DROP TYPE "public"."enum__pages_v_blocks_historier_variant";
  DROP TYPE "public"."enum__pages_v_blocks_arrangementer_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_historier_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_arrangementer_variant";`)
}
