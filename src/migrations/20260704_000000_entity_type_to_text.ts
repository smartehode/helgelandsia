import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // brregEntityType var definert som select med norske verdier ('hovedenhet'/'underenhet'),
  // men synk-koden hadde skrivefeil og brukte nederlandske verdier ('hoofdenhet'/'onderenhet').
  // Payload-valideringen avviste de nederlandske verdiene → ValidationError på alle underenheter.
  // Trinn 1: konverter enum-kolonner til varchar (USING-cast bevarer eksisterende data).
  // Trinn 2: normaliser eventuelle nederlandske verdier til norske.
  await db.execute(sql`
    ALTER TABLE "businesses"
      ALTER COLUMN "brreg_entity_type" TYPE varchar
      USING "brreg_entity_type"::text;

    ALTER TABLE "_businesses_v"
      ALTER COLUMN "version_brreg_entity_type" TYPE varchar
      USING "version_brreg_entity_type"::text;

    DROP TYPE IF EXISTS "public"."enum_businesses_brreg_entity_type";
    DROP TYPE IF EXISTS "public"."enum__businesses_v_version_brreg_entity_type";

    UPDATE "businesses"
      SET "brreg_entity_type" = 'hovedenhet'
      WHERE "brreg_entity_type" = 'hoofdenhet';

    UPDATE "businesses"
      SET "brreg_entity_type" = 'underenhet'
      WHERE "brreg_entity_type" = 'onderenhet';

    UPDATE "_businesses_v"
      SET "version_brreg_entity_type" = 'hovedenhet'
      WHERE "version_brreg_entity_type" = 'hoofdenhet';

    UPDATE "_businesses_v"
      SET "version_brreg_entity_type" = 'underenhet'
      WHERE "version_brreg_entity_type" = 'onderenhet';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Bevisst tom — konverterer ikke tilbake til en mer restriktiv enum og risikerer datatap.
}