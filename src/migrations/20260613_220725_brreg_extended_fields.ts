import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "sekundaer_nace_kode" varchar;
  ALTER TABLE "businesses" ADD COLUMN "sekundaer_nace_beskrivelse" varchar;
  ALTER TABLE "businesses" ADD COLUMN "organisasjonsform_beskrivelse" varchar;
  ALTER TABLE "businesses" ADD COLUMN "stiftelsesdato" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "brreg_hjemmeside" varchar;
  ALTER TABLE "businesses" ADD COLUMN "aktivitet" varchar;
  ALTER TABLE "businesses" ADD COLUMN "forretningsadresse_gate" varchar;
  ALTER TABLE "businesses" ADD COLUMN "forretningsadresse_postnummer" varchar;
  ALTER TABLE "businesses" ADD COLUMN "forretningsadresse_poststed" varchar;
  ALTER TABLE "businesses" ADD COLUMN "postadresse_gate" varchar;
  ALTER TABLE "businesses" ADD COLUMN "postadresse_postnummer" varchar;
  ALTER TABLE "businesses" ADD COLUMN "postadresse_poststed" varchar;
  ALTER TABLE "businesses" ADD COLUMN "registrert_i_mvaregisteret" boolean DEFAULT false;
  ALTER TABLE "businesses" ADD COLUMN "registrert_i_foretaksregisteret" boolean DEFAULT false;
  ALTER TABLE "businesses" ADD COLUMN "registrert_i_frivillighetsregisteret" boolean DEFAULT false;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_sekundaer_nace_kode" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_sekundaer_nace_beskrivelse" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_organisasjonsform_beskrivelse" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_stiftelsesdato" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_brreg_hjemmeside" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_aktivitet" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_forretningsadresse_gate" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_forretningsadresse_postnummer" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_forretningsadresse_poststed" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_postadresse_gate" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_postadresse_postnummer" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_postadresse_poststed" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_registrert_i_mvaregisteret" boolean DEFAULT false;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_registrert_i_foretaksregisteret" boolean DEFAULT false;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_registrert_i_frivillighetsregisteret" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP COLUMN "sekundaer_nace_kode";
  ALTER TABLE "businesses" DROP COLUMN "sekundaer_nace_beskrivelse";
  ALTER TABLE "businesses" DROP COLUMN "organisasjonsform_beskrivelse";
  ALTER TABLE "businesses" DROP COLUMN "stiftelsesdato";
  ALTER TABLE "businesses" DROP COLUMN "brreg_hjemmeside";
  ALTER TABLE "businesses" DROP COLUMN "aktivitet";
  ALTER TABLE "businesses" DROP COLUMN "forretningsadresse_gate";
  ALTER TABLE "businesses" DROP COLUMN "forretningsadresse_postnummer";
  ALTER TABLE "businesses" DROP COLUMN "forretningsadresse_poststed";
  ALTER TABLE "businesses" DROP COLUMN "postadresse_gate";
  ALTER TABLE "businesses" DROP COLUMN "postadresse_postnummer";
  ALTER TABLE "businesses" DROP COLUMN "postadresse_poststed";
  ALTER TABLE "businesses" DROP COLUMN "registrert_i_mvaregisteret";
  ALTER TABLE "businesses" DROP COLUMN "registrert_i_foretaksregisteret";
  ALTER TABLE "businesses" DROP COLUMN "registrert_i_frivillighetsregisteret";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_sekundaer_nace_kode";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_sekundaer_nace_beskrivelse";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_organisasjonsform_beskrivelse";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_stiftelsesdato";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_brreg_hjemmeside";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_aktivitet";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_forretningsadresse_gate";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_forretningsadresse_postnummer";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_forretningsadresse_poststed";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_postadresse_gate";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_postadresse_postnummer";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_postadresse_poststed";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_registrert_i_mvaregisteret";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_registrert_i_foretaksregisteret";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_registrert_i_frivillighetsregisteret";`)
}
