import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_press_releases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__press_releases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_newsletters_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__newsletters_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "press_releases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"organization" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"image_id" integer,
  	"contact_name" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"slug" varchar,
  	"submitted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_press_releases_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_press_releases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_organization" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_image_id" integer,
  	"version_contact_name" varchar,
  	"version_contact_email" varchar,
  	"version_contact_phone" varchar,
  	"version_slug" varchar,
  	"version_submitted_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__press_releases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "newsletters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"organization" varchar,
  	"content" jsonb,
  	"image_id" integer,
  	"slug" varchar,
  	"submitted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_newsletters_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_newsletters_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_organization" varchar,
  	"version_content" jsonb,
  	"version_image_id" integer,
  	"version_slug" varchar,
  	"version_submitted_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__newsletters_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "press_releases_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletters_id" integer;
  ALTER TABLE "press_releases" ADD CONSTRAINT "press_releases_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "press_releases" ADD CONSTRAINT "press_releases_submitted_by_id_members_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_press_releases_v" ADD CONSTRAINT "_press_releases_v_parent_id_press_releases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."press_releases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_press_releases_v" ADD CONSTRAINT "_press_releases_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_press_releases_v" ADD CONSTRAINT "_press_releases_v_version_submitted_by_id_members_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_submitted_by_id_members_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_newsletters_v" ADD CONSTRAINT "_newsletters_v_parent_id_newsletters_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."newsletters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_newsletters_v" ADD CONSTRAINT "_newsletters_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_newsletters_v" ADD CONSTRAINT "_newsletters_v_version_submitted_by_id_members_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "press_releases_image_idx" ON "press_releases" USING btree ("image_id");
  CREATE UNIQUE INDEX "press_releases_slug_idx" ON "press_releases" USING btree ("slug");
  CREATE INDEX "press_releases_submitted_by_idx" ON "press_releases" USING btree ("submitted_by_id");
  CREATE INDEX "press_releases_updated_at_idx" ON "press_releases" USING btree ("updated_at");
  CREATE INDEX "press_releases_created_at_idx" ON "press_releases" USING btree ("created_at");
  CREATE INDEX "press_releases__status_idx" ON "press_releases" USING btree ("_status");
  CREATE INDEX "_press_releases_v_parent_idx" ON "_press_releases_v" USING btree ("parent_id");
  CREATE INDEX "_press_releases_v_version_version_image_idx" ON "_press_releases_v" USING btree ("version_image_id");
  CREATE INDEX "_press_releases_v_version_version_slug_idx" ON "_press_releases_v" USING btree ("version_slug");
  CREATE INDEX "_press_releases_v_version_version_submitted_by_idx" ON "_press_releases_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_press_releases_v_version_version_updated_at_idx" ON "_press_releases_v" USING btree ("version_updated_at");
  CREATE INDEX "_press_releases_v_version_version_created_at_idx" ON "_press_releases_v" USING btree ("version_created_at");
  CREATE INDEX "_press_releases_v_version_version__status_idx" ON "_press_releases_v" USING btree ("version__status");
  CREATE INDEX "_press_releases_v_created_at_idx" ON "_press_releases_v" USING btree ("created_at");
  CREATE INDEX "_press_releases_v_updated_at_idx" ON "_press_releases_v" USING btree ("updated_at");
  CREATE INDEX "_press_releases_v_latest_idx" ON "_press_releases_v" USING btree ("latest");
  CREATE INDEX "newsletters_image_idx" ON "newsletters" USING btree ("image_id");
  CREATE UNIQUE INDEX "newsletters_slug_idx" ON "newsletters" USING btree ("slug");
  CREATE INDEX "newsletters_submitted_by_idx" ON "newsletters" USING btree ("submitted_by_id");
  CREATE INDEX "newsletters_updated_at_idx" ON "newsletters" USING btree ("updated_at");
  CREATE INDEX "newsletters_created_at_idx" ON "newsletters" USING btree ("created_at");
  CREATE INDEX "newsletters__status_idx" ON "newsletters" USING btree ("_status");
  CREATE INDEX "_newsletters_v_parent_idx" ON "_newsletters_v" USING btree ("parent_id");
  CREATE INDEX "_newsletters_v_version_version_image_idx" ON "_newsletters_v" USING btree ("version_image_id");
  CREATE INDEX "_newsletters_v_version_version_slug_idx" ON "_newsletters_v" USING btree ("version_slug");
  CREATE INDEX "_newsletters_v_version_version_submitted_by_idx" ON "_newsletters_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_newsletters_v_version_version_updated_at_idx" ON "_newsletters_v" USING btree ("version_updated_at");
  CREATE INDEX "_newsletters_v_version_version_created_at_idx" ON "_newsletters_v" USING btree ("version_created_at");
  CREATE INDEX "_newsletters_v_version_version__status_idx" ON "_newsletters_v" USING btree ("version__status");
  CREATE INDEX "_newsletters_v_created_at_idx" ON "_newsletters_v" USING btree ("created_at");
  CREATE INDEX "_newsletters_v_updated_at_idx" ON "_newsletters_v" USING btree ("updated_at");
  CREATE INDEX "_newsletters_v_latest_idx" ON "_newsletters_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_press_releases_fk" FOREIGN KEY ("press_releases_id") REFERENCES "public"."press_releases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletters_fk" FOREIGN KEY ("newsletters_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_press_releases_id_idx" ON "payload_locked_documents_rels" USING btree ("press_releases_id");
  CREATE INDEX "payload_locked_documents_rels_newsletters_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletters_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "press_releases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_press_releases_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_newsletters_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "press_releases" CASCADE;
  DROP TABLE "_press_releases_v" CASCADE;
  DROP TABLE "newsletters" CASCADE;
  DROP TABLE "_newsletters_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_press_releases_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletters_fk";
  
  DROP INDEX "payload_locked_documents_rels_press_releases_id_idx";
  DROP INDEX "payload_locked_documents_rels_newsletters_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "press_releases_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletters_id";
  DROP TYPE "public"."enum_press_releases_status";
  DROP TYPE "public"."enum__press_releases_v_version_status";
  DROP TYPE "public"."enum_newsletters_status";
  DROP TYPE "public"."enum__newsletters_v_version_status";`)
}
