import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_skipstrafikk_hoyde" AS ENUM('normal', 'lav');
  CREATE TYPE "public"."enum__pages_v_blocks_skipstrafikk_hoyde" AS ENUM('normal', 'lav');
  CREATE TYPE "public"."enum_sidefelt_blocks_skipstrafikk_hoyde" AS ENUM('normal', 'lav');
  CREATE TABLE "pages_blocks_skipstrafikk" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hoyde" "enum_pages_blocks_skipstrafikk_hoyde" DEFAULT 'normal',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_skipstrafikk" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hoyde" "enum__pages_v_blocks_skipstrafikk_hoyde" DEFAULT 'normal',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sidefelt_blocks_skipstrafikk" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hoyde" "enum_sidefelt_blocks_skipstrafikk_hoyde" DEFAULT 'normal',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_skipstrafikk" ADD CONSTRAINT "pages_blocks_skipstrafikk_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_skipstrafikk" ADD CONSTRAINT "_pages_v_blocks_skipstrafikk_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sidefelt_blocks_skipstrafikk" ADD CONSTRAINT "sidefelt_blocks_skipstrafikk_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sidefelt"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_skipstrafikk_order_idx" ON "pages_blocks_skipstrafikk" USING btree ("_order");
  CREATE INDEX "pages_blocks_skipstrafikk_parent_id_idx" ON "pages_blocks_skipstrafikk" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_skipstrafikk_path_idx" ON "pages_blocks_skipstrafikk" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_skipstrafikk_order_idx" ON "_pages_v_blocks_skipstrafikk" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_skipstrafikk_parent_id_idx" ON "_pages_v_blocks_skipstrafikk" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_skipstrafikk_path_idx" ON "_pages_v_blocks_skipstrafikk" USING btree ("_path");
  CREATE INDEX "sidefelt_blocks_skipstrafikk_order_idx" ON "sidefelt_blocks_skipstrafikk" USING btree ("_order");
  CREATE INDEX "sidefelt_blocks_skipstrafikk_parent_id_idx" ON "sidefelt_blocks_skipstrafikk" USING btree ("_parent_id");
  CREATE INDEX "sidefelt_blocks_skipstrafikk_path_idx" ON "sidefelt_blocks_skipstrafikk" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_skipstrafikk" CASCADE;
  DROP TABLE "_pages_v_blocks_skipstrafikk" CASCADE;
  DROP TABLE "sidefelt_blocks_skipstrafikk" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_skipstrafikk_hoyde";
  DROP TYPE "public"."enum__pages_v_blocks_skipstrafikk_hoyde";
  DROP TYPE "public"."enum_sidefelt_blocks_skipstrafikk_hoyde";`)
}
