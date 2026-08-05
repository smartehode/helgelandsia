import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { afterChangeApproved } from '../lib/email/submission-approved'
import { mapNaceToCategory, CATEGORY_SELECT_OPTIONS } from '../lib/businesses/categories'

function setCategoryFromNace({ data }: { data: any }) {
  // Dersom naceKode er med i oppdateringen, utled naceCategory automatisk.
  // Berøres ikke hvis naceKode ikke er i payloaden (bevarer manuell overstyring).
  if ('naceKode' in data) {
    data.naceCategory = mapNaceToCategory(data.naceKode)
  }
  return data
}

async function geocodeHook({ data }: { data: any }) {
  const city = String(data.city || '').trim()
  if (!city) return data
  const q = [city, data.county, data.country].filter(Boolean).join(', ')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'json', limit: '1' })}`,
      { headers: { 'User-Agent': 'Helgelandsia/1.0 (helgelandsia.no)' } },
    )
    const [hit] = (await res.json()) as any[]
    if (hit) {
      data.lat = parseFloat(hit.lat)
      data.lng = parseFloat(hit.lon)
    }
  } catch { /* stille feil — lat/lng forblir uendret */ }
  return data
}

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  labels: { singular: 'Bedrift', plural: 'Bedrifter' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brregEntityType', 'claimStatus', 'kommunenavn', 'featured', '_status'],
    group: 'Innhold',
    // Viser kun hovedenheter som standard — redaksjonen slipper doble rader.
    // Underenheter vises på moderenhetens detaljside under «Avdelinger».
    baseListFilter: ({ req }) => {
      // Pending-claims-lenken fra admin-dashbordet inkluderer claimStatus i URL-en.
      // Da vises alle entitetstyper, slik at underenheters claims ikke skjules.
      if ((req?.url ?? '').includes('claimStatus')) return {}
      return { brregEntityType: { equals: 'hovedenhet' } }
    },
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [setCategoryFromNace, geocodeHook],
    afterChange: [afterChangeApproved('businesses')],
  },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profil',
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Navn' },
            { name: 'tagline', type: 'text', label: 'Slagord / kort beskrivelse' },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
            {
              name: 'description',
              type: 'richText',
              label: 'Beskrivelse',
              editor: lexicalEditor(),
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Bildegalleri',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
              ],
            },
          ],
        },
        {
          label: 'Kontakt & kart',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', label: 'Telefon', admin: { width: '50%' } },
                { name: 'email', type: 'email', label: 'E-post', admin: { width: '50%' } },
              ],
            },
            { name: 'website', type: 'text', label: 'Nettside (URL)' },
            { name: 'address', type: 'text', label: 'Adresse' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', label: 'By', admin: { width: '40%' } },
                { name: 'county', type: 'text', label: 'Fylke', admin: { width: '30%' } },
                { name: 'country', type: 'text', label: 'Land', defaultValue: 'Norge', admin: { width: '30%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'lat', type: 'number', label: 'Breddegrad (auto)', admin: { width: '50%', readOnly: true, description: 'Fylles ut automatisk fra By/Fylke/Land' } },
                { name: 'lng', type: 'number', label: 'Lengdegrad (auto)', admin: { width: '50%', readOnly: true, description: 'Fylles ut automatisk fra By/Fylke/Land' } },
              ],
            },
            {
              name: 'openingHours',
              type: 'array',
              label: 'Åpningstider',
              fields: [
                {
                  name: 'day',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Mandag', value: 'mon' },
                    { label: 'Tirsdag', value: 'tue' },
                    { label: 'Onsdag', value: 'wed' },
                    { label: 'Torsdag', value: 'thu' },
                    { label: 'Fredag', value: 'fri' },
                    { label: 'Lørdag', value: 'sat' },
                    { label: 'Søndag', value: 'sun' },
                  ],
                },
                { name: 'opens', type: 'text', label: 'Åpner (f.eks. 09:00)' },
                { name: 'closes', type: 'text', label: 'Stenger (f.eks. 17:00)' },
              ],
            },
            {
              name: 'social',
              type: 'group',
              label: 'Sosiale medier',
              fields: [
                { name: 'facebook', type: 'text' },
                { name: 'instagram', type: 'text' },
                { name: 'linkedin', type: 'text' },
                { name: 'tiktok', type: 'text' },
                { name: 'youtube', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'BRREG-data',
          description: 'Synkroniseres automatisk fra Brønnøysundregistrene. Endre kun ved behov for korrigering.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'brregLastSynced',
                  type: 'date',
                  label: 'Sist synkronisert',
                  admin: {
                    width: '50%',
                    readOnly: true,
                    date: { pickerAppearance: 'dayAndTime' },
                  },
                },
                {
                  name: 'brregEntityType',
                  type: 'text',
                  label: 'Enhetstype',
                  admin: { width: '50%', readOnly: true },
                },
              ],
            },
            {
              name: 'brregStatus',
              type: 'select',
              label: 'BRREG-status',
              options: [
                { label: 'Aktiv', value: 'aktiv' },
                { label: 'Under avvikling', value: 'underAvvikling' },
                { label: 'Konkurs', value: 'konkurs' },
                { label: 'Slettet fra Enhetsregisteret', value: 'slettet' },
                { label: 'Fjernet (ikke lenger tilgjengelig)', value: 'fjernet' },
              ],
            },
            { name: 'parentOrgnr', type: 'text', label: 'Overordnet enhet (orgnr)', admin: { readOnly: true } },
            {
              type: 'row',
              fields: [
                { name: 'naceKode', type: 'text', label: 'NACE-kode', admin: { width: '30%', readOnly: true } },
                { name: 'naceBeskrivelse', type: 'text', label: 'Næringsbeskrivelse', admin: { width: '70%', readOnly: true } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'sekundaerNaceKode', type: 'text', label: 'Sekundær NACE-kode', admin: { width: '30%', readOnly: true } },
                { name: 'sekundaerNaceBeskrivelse', type: 'text', label: 'Sekundær næringsbeskrivelse', admin: { width: '70%', readOnly: true } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'organisasjonsform', type: 'text', label: 'Organisasjonsform', admin: { width: '40%', readOnly: true } },
                { name: 'organisasjonsformBeskrivelse', type: 'text', label: 'Organisasjonsform (klartekst)', admin: { width: '60%', readOnly: true } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'kommunenummer', type: 'text', label: 'Kommunenummer', admin: { width: '40%', readOnly: true } },
                { name: 'kommunenavn', type: 'text', label: 'Kommune', admin: { width: '60%', readOnly: true } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'registreringsdato',
                  type: 'date',
                  label: 'Registrert',
                  admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' } },
                },
                {
                  name: 'avregistreringsdato',
                  type: 'date',
                  label: 'Avregistrert',
                  admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' } },
                },
              ],
            },
            { name: 'antallAnsatte', type: 'number', label: 'Antall ansatte', admin: { readOnly: true } },
            {
              type: 'row',
              fields: [
                {
                  name: 'stiftelsesdato',
                  type: 'date',
                  label: 'Stiftelsesdato',
                  admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' } },
                },
                { name: 'brregHjemmeside', type: 'text', label: 'Nettside (BRREG)', admin: { width: '50%', readOnly: true, description: 'Fra Brønnøysundregistrene — ikke endre manuelt.' } },
              ],
            },
            { name: 'aktivitet', type: 'textarea', label: 'Virksomhetsbeskrivelse (BRREG)', admin: { readOnly: true } },
            { name: 'formaal', type: 'textarea', label: 'Vedtektsfestet formål (BRREG)', admin: { readOnly: true, description: 'Fra vedtektene i Foretaksregisteret, tilgjengelig for AS og noen andre selskapsformer.' } },
            {
              name: 'forretningsadresse',
              type: 'group',
              label: 'Forretningsadresse',
              fields: [
                { name: 'gate', type: 'text', label: 'Gate/adresse', admin: { readOnly: true } },
                {
                  type: 'row',
                  fields: [
                    { name: 'postnummer', type: 'text', label: 'Postnummer', admin: { width: '40%', readOnly: true } },
                    { name: 'poststed', type: 'text', label: 'Poststed', admin: { width: '60%', readOnly: true } },
                  ],
                },
              ],
            },
            {
              name: 'postadresse',
              type: 'group',
              label: 'Postadresse',
              fields: [
                { name: 'gate', type: 'text', label: 'Gate/adresse', admin: { readOnly: true } },
                {
                  type: 'row',
                  fields: [
                    { name: 'postnummer', type: 'text', label: 'Postnummer', admin: { width: '40%', readOnly: true } },
                    { name: 'poststed', type: 'text', label: 'Poststed', admin: { width: '60%', readOnly: true } },
                  ],
                },
              ],
            },
            { name: 'registrertIMvaregisteret', type: 'checkbox', label: 'MVA-registrert', defaultValue: false, admin: { readOnly: true } },
            { name: 'registrertIForetaksregisteret', type: 'checkbox', label: 'Registrert i Foretaksregisteret', defaultValue: false, admin: { readOnly: true } },
            { name: 'registrertIFrivillighetsregisteret', type: 'checkbox', label: 'Registrert i Frivillighetsregisteret', defaultValue: false, admin: { readOnly: true } },
          ],
        },
        {
          label: 'Berikelse',
          description: 'Rik innhold — fylles ut av bedriftseieren etter godkjent krav.',
          fields: [
            {
              name: 'video',
              type: 'text',
              label: 'Video-URL',
              admin: {
                description: 'YouTube- eller Vimeo-lenke. Eksempel: https://www.youtube.com/watch?v=...',
              },
            },
          ],
        },
        {
          label: 'Eierskap',
          description: 'Kravflyt og verifisert eier. Administreres av redaksjonen.',
          fields: [
            {
              name: 'claimStatus',
              type: 'select',
              label: 'Kravstatus',
              defaultValue: 'unclaimed',
              options: [
                { label: 'Ukrevd', value: 'unclaimed' },
                { label: 'Venter på godkjenning', value: 'pending' },
                { label: 'Verifisert eier', value: 'verified' },
              ],
              admin: {
                description: '"Verifisert" settes av admin når kravet er godkjent.',
                components: {
                  Cell: '@/components/admin/ClaimStatusCell',
                },
              },
            },
            {
              name: 'owner',
              type: 'relationship',
              relationTo: 'members',
              label: 'Eier (member)',
              admin: {
                description: 'Bekreftet bedriftseier — settes av admin ved godkjenning av krav.',
              },
              access: { read: ({ req: { user } }) => Boolean(user) },
            },
          ],
        },
      ],
    },
    slugField('name'),
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' }, access: { read: ({ req: { user } }) => Boolean(user) } },
    {
      name: 'orgnr',
      type: 'text',
      label: 'Organisasjonsnummer',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Settes automatisk ved BRREG-import. Kan kobles manuelt for å lenke en manuelt registrert bedrift til BRREG.',
      },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Kilde',
      defaultValue: 'member',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Innsendt av medlem', value: 'member' },
        { label: 'Importert fra BRREG', value: 'brreg' },
      ],
    },
    {
      name: 'claimed',
      type: 'checkbox',
      label: 'Bedriften er krevd av eier',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'claimedBy',
      type: 'relationship',
      relationTo: 'members',
      label: 'Krevd av (bruker)',
      admin: { position: 'sidebar' },
      access: { read: ({ req: { user } }) => Boolean(user) },
    },
    {
      name: 'claimedAt',
      type: 'date',
      label: 'Krevd dato',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' } },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
      label: 'Bransje/kategori',
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: 'places',
      admin: { position: 'sidebar' },
      label: 'Sted',
    },
    {
      name: 'showOnPublicListing',
      type: 'checkbox',
      defaultValue: true,
      label: 'Vis i offentlig bedriftsliste',
      admin: {
        position: 'sidebar',
        description: 'Settes av BRREG-synken. Underenheter skjules automatisk når morselskapet er i katalogen.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Fremhevet',
      admin: {
        position: 'sidebar',
        components: {
          Cell: '@/components/admin/FeaturedCell',
        },
      },
    },
    {
      name: 'naceCategory',
      type: 'select',
      label: 'Bransje (NACE)',
      index: true,
      options: CATEGORY_SELECT_OPTIONS,
      admin: {
        position: 'sidebar',
        description: 'Settes automatisk fra NACE-koden ved synk. Kan overstyres manuelt for meldingsbaserte bedrifter.',
      },
    },
    {
      name: 'mottarOppdrag',
      type: 'checkbox',
      defaultValue: false,
      label: 'Motta oppdragsvarsler',
      admin: {
        position: 'sidebar',
        description: 'Bedriften ønsker å motta varsler om lokale oppdrag i sin bransje.',
      },
    },
    {
      name: 'aiSammendrag',
      type: 'textarea',
      label: 'KI-sammendrag',
      admin: {
        position: 'sidebar',
        description: 'Generert av KI basert på regnskapstall. Kan redigeres eller slettes manuelt.',
      },
    },
    {
      name: 'aiSammendragAar',
      type: 'number',
      label: 'KI-sammendrag regnskapsår',
      admin: {
        position: 'sidebar',
        description: 'Regnskapsåret sammendraget er basert på.',
      },
    },
    {
      name: 'aiGenerertDato',
      type: 'date',
      label: 'KI-sammendrag generert dato',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' },
      },
    },
  ],
}
