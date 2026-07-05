import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_anbud_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum__pages_v_blocks_anbud_variant" AS ENUM('full', 'kompakt');
  CREATE TYPE "public"."enum_sidefelt_blocks_anbud_variant" AS ENUM('full', 'kompakt');
  CREATE TABLE "pages_blocks_anbud" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_pages_blocks_anbud_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_anbud" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum__pages_v_blocks_anbud_variant" DEFAULT 'full',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_featured_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_business_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"category_id" integer,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_event_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"text" varchar,
  	"button_label" varchar,
  	"button_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_anbud" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"count" numeric DEFAULT 5,
  	"variant" "enum_sidefelt_blocks_anbud_variant" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer
  );
  
  ALTER TABLE "pages_blocks_anbud" ADD CONSTRAINT "pages_blocks_anbud_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_anbud" ADD CONSTRAINT "_pages_v_blocks_anbud_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_hero" ADD CONSTRAINT "sidefelt_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_hero" ADD CONSTRAINT "sidefelt_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_rich_text" ADD CONSTRAINT "sidefelt_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_featured_posts" ADD CONSTRAINT "sidefelt_blocks_featured_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_business_list" ADD CONSTRAINT "sidefelt_blocks_business_list_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_business_list" ADD CONSTRAINT "sidefelt_blocks_business_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_event_list" ADD CONSTRAINT "sidefelt_blocks_event_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_cta" ADD CONSTRAINT "sidefelt_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_anbud" ADD CONSTRAINT "sidefelt_blocks_anbud_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_rels" ADD CONSTRAINT "sidefelt_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_rels" ADD CONSTRAINT "sidefelt_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_anbud_order_idx" ON "pages_blocks_anbud" USING btree ("_order");
  CREATE INDEX "pages_blocks_anbud_parent_id_idx" ON "pages_blocks_anbud" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_anbud_path_idx" ON "pages_blocks_anbud" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_anbud_order_idx" ON "_pages_v_blocks_anbud" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_anbud_parent_id_idx" ON "_pages_v_blocks_anbud" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_anbud_path_idx" ON "_pages_v_blocks_anbud" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_hero_order_idx" ON "sidefelt_blocks_hero" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_hero_parent_id_idx" ON "sidefelt_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_hero_path_idx" ON "sidefelt_blocks_hero" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_hero_image_idx" ON "sidefelt_blocks_hero" USING btree ("image_id");
  CREATE INDEX "sidefelt_blocks_rich_text_order_idx" ON "sidefelt_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_rich_text_parent_id_idx" ON "sidefelt_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_rich_text_path_idx" ON "sidefelt_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_featured_posts_order_idx" ON "sidefelt_blocks_featured_posts" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_featured_posts_parent_id_idx" ON "sidefelt_blocks_featured_posts" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_featured_posts_path_idx" ON "sidefelt_blocks_featured_posts" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_business_list_order_idx" ON "sidefelt_blocks_business_list" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_business_list_parent_id_idx" ON "sidefelt_blocks_business_list" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_business_list_path_idx" ON "sidefelt_blocks_business_list" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_business_list_category_idx" ON "sidefelt_blocks_business_list" USING btree ("category_id");
  CREATE INDEX "sidefelt_blocks_event_list_order_idx" ON "sidefelt_blocks_event_list" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_event_list_parent_id_idx" ON "sidefelt_blocks_event_list" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_event_list_path_idx" ON "sidefelt_blocks_event_list" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_cta_order_idx" ON "sidefelt_blocks_cta" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_cta_parent_id_idx" ON "sidefelt_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_cta_path_idx" ON "sidefelt_blocks_cta" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_anbud_order_idx" ON "sidefelt_blocks_anbud" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_anbud_parent_id_idx" ON "sidefelt_blocks_anbud" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_anbud_path_idx" ON "sidefelt_blocks_anbud" USING btree ("_path");
  CREATE INDEX "sidefelt_rels_order_idx" ON "sidefelt_rels" USING btree ("order");
  CREATE INDEX "sidefelt_rels_parent_idx" ON "sidefelt_rels" USING btree ("parent_id");
  CREATE INDEX "sidefelt_rels_path_idx" ON "sidefelt_rels" USING btree ("path");
  CREATE INDEX "sidefelt_rels_posts_id_idx" ON "sidefelt_rels" USING btree ("posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_anbud" CASCADE;
  DROP TABLE "_pages_v_blocks_anbud" CASCADE;
  DROP TABLE "sidefelt_blocks_hero" CASCADE;
  DROP TABLE "sidefelt_blocks_rich_text" CASCADE;
  DROP TABLE "sidefelt_blocks_featured_posts" CASCADE;
  DROP TABLE "sidefelt_blocks_business_list" CASCADE;
  DROP TABLE "sidefelt_blocks_event_list" CASCADE;
  DROP TABLE "sidefelt_blocks_cta" CASCADE;
  DROP TABLE "sidefelt_blocks_anbud" CASCADE;
  DROP TABLE "sidefelt_rels" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_anbud_variant";
  DROP TYPE "public"."enum__pages_v_blocks_anbud_variant";
  DROP TYPE "public"."enum_sidefelt_blocks_anbud_variant";`)
}
