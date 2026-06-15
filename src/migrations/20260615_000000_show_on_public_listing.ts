import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Eneste gjenværende drift mellom config og migrasjonshistorikk per 2026-06-15.
  // IF NOT EXISTS: prod fikk show_on_public_listing på businesses via manuell ALTER,
  // mens version_show_on_public_listing på _businesses_v aldri ble lagt til.
  // Begge ADD-er er idempotente — trygge å kjøre selv om kolonnen allerede finnes.
  await db.execute(sql`
   ALTER TABLE "businesses"
    ADD COLUMN IF NOT EXISTS "show_on_public_listing" boolean DEFAULT true;
  ALTER TABLE "_businesses_v"
    ADD COLUMN IF NOT EXISTS "version_show_on_public_listing" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Bevisst tom — vi dropper ikke en kolonne som kan inneholde manuelt satt data.
}
