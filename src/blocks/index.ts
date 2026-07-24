import type { Block, Field } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

// Gjenbrukbare layout-blokker for fleksible sider.
// Redaktøren stabler disse i ønsket rekkefølge i adminpanelet.

const breddeField: Field = {
  name: 'bredde',
  type: 'select',
  label: 'Bredde i sonen',
  defaultValue: '1',
  admin: {
    description: 'Hvor bredt elementet skal stå i sone-gridet.',
  },
  options: [
    { label: '1 kolonne', value: '1' },
    { label: '2 kolonner', value: '2' },
    { label: 'Full bredde', value: 'full' },
  ],
}

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero-seksjoner' },
  fields: [
    { name: 'heading', type: 'text', required: true, label: 'Overskrift' },
    { name: 'subheading', type: 'textarea', label: 'Undertekst' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bakgrunnsbilde' },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Knappetekst', admin: { width: '50%' } },
        { name: 'ctaUrl', type: 'text', label: 'Knappelenke', admin: { width: '50%' } },
      ],
    },
    breddeField,
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Tekstseksjon', plural: 'Tekstseksjoner' },
  fields: [
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true },
    breddeField,
  ],
}

export const FeaturedPostsBlock: Block = {
  slug: 'featuredPosts',
  labels: { singular: 'Fremhevede leserinnlegg', plural: 'Fremhevede leserinnlegg' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: 'Velg artikler',
    },
    breddeField,
  ],
}

export const BusinessListBlock: Block = {
  slug: 'businessList',
  labels: { singular: 'Bedriftsliste', plural: 'Bedriftslister' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Filtrer på kategori (valgfritt)',
    },
    { name: 'limit', type: 'number', defaultValue: 6, label: 'Antall' },
    breddeField,
  ],
}

export const EventListBlock: Block = {
  slug: 'eventList',
  labels: { singular: 'Arrangementsliste', plural: 'Arrangementslister' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    { name: 'limit', type: 'number', defaultValue: 6, label: 'Antall' },
    breddeField,
  ],
}

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'Handlingsfremmende', plural: 'Handlingsfremmende' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text' },
    { name: 'buttonUrl', type: 'text' },
    breddeField,
  ],
}

export const PowerPricesBlock: Block = {
  slug: 'powerPrices',
  labels: { singular: 'Strømpriswidget', plural: 'Strømpriswidgeter' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'zone',
      type: 'select',
      label: 'Prissone',
      defaultValue: 'NO4',
      options: [
        { label: 'NO1 – Oslo / Øst-Norge', value: 'NO1' },
        { label: 'NO2 – Sørvestlandet', value: 'NO2' },
        { label: 'NO3 – Midt-Norge', value: 'NO3' },
        { label: 'NO4 – Nord-Norge', value: 'NO4' },
        { label: 'NO5 – Vestlandet', value: 'NO5' },
      ],
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – inkl. søylediagram', value: 'full' },
        { label: 'Kompakt – kun nåpris og min/maks', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const WeatherBlock: Block = {
  slug: 'weather',
  labels: { singular: 'Værwidget', plural: 'Værwidgeter' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'locations',
      type: 'array',
      label: 'Steder',
      admin: { description: 'La stå tomt for standard Helgeland-steder (Brønnøysund, Sandnessjøen, Mosjøen, Mo i Rana).' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Stednavn' },
        {
          type: 'row',
          fields: [
            { name: 'lat', type: 'number', required: true, label: 'Breddegrad', admin: { width: '50%' } },
            { name: 'lon', type: 'number', required: true, label: 'Lengdegrad', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'days',
      type: 'number',
      label: 'Dager frem i tid',
      defaultValue: 4,
      min: 1,
      max: 7,
      admin: { description: '1–7 dager.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – med daglig varsel', value: 'full' },
        { label: 'Kompakt – kun nåværende vær', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const FlightsBlock: Block = {
  slug: 'flights',
  labels: { singular: 'Flyavganger', plural: 'Flyavganger' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'airports',
      type: 'select',
      hasMany: true,
      label: 'Flyplasser',
      defaultValue: ['BNN', 'SSJ', 'MJF'],
      options: [
        { label: 'Brønnøysund (BNN)', value: 'BNN' },
        { label: 'Sandnessjøen (SSJ)', value: 'SSJ' },
        { label: 'Mosjøen (MJF)', value: 'MJF' },
      ],
    },
    {
      name: 'direction',
      type: 'select',
      label: 'Retning',
      defaultValue: 'departure',
      options: [
        { label: 'Avganger', value: 'departure' },
        { label: 'Ankomster', value: 'arrival' },
        { label: 'Begge retninger', value: 'begge' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      label: 'Antall per flyplass',
      defaultValue: 4,
      min: 1,
      max: 10,
      admin: { description: '1–10 avganger per flyplass.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – inkl. forsinkelse og kansellering', value: 'full' },
        { label: 'Kompakt – kun tid, flightnummer og destinasjon', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const NavJobsBlock: Block = {
  slug: 'navJobs',
  labels: { singular: 'NAV-stillinger', plural: 'NAV-stillinger' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall stillinger',
      defaultValue: 6,
      min: 1,
      max: 20,
      admin: { description: '1–20 stillinger fra NAV Arbeidsplassen.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – tittel, arbeidsgiver, kommune og frist', value: 'full' },
        { label: 'Kompakt – tittel og arbeidsgiver', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const NewsBlock: Block = {
  slug: 'news',
  labels: { singular: 'Lokale nyheter', plural: 'Lokale nyheter' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'sources',
      type: 'select',
      hasMany: true,
      label: 'Kilder',
      admin: { description: 'La stå tomt for alle fire kilder.' },
      options: [
        { label: 'BAnett', value: 'BAnett' },
        { label: 'Helgelendingen', value: 'Helgelendingen' },
        { label: 'Helgelands Blad', value: 'Helgelands Blad' },
        { label: 'NRK Nordland', value: 'NRK Nordland' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      label: 'Antall nyheter',
      defaultValue: 8,
      min: 1,
      max: 20,
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – tittel, kilde og tid', value: 'full' },
        { label: 'Kompakt – tittel og kilde', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const BrregBlock: Block = {
  slug: 'brreg',
  labels: { singular: 'Nye bedrifter', plural: 'Nye bedrifter' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall bedrifter',
      defaultValue: 5,
      min: 1,
      max: 20,
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – navn, kommune, org.form og dato', value: 'full' },
        { label: 'Kompakt – navn og kommune', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const WebcamBlock: Block = {
  slug: 'webcam',
  labels: { singular: 'Webkamera og vær', plural: 'Webkamera og vær' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'locations',
      type: 'array',
      label: 'Lokasjoner',
      admin: { description: 'La stå tomt for standard Helgeland-lokasjoner (Brønnøysund, Sandnessjøen, Mosjøen).' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Stedsnavn' },
        {
          type: 'row',
          fields: [
            { name: 'lat', type: 'number', required: true, label: 'Breddegrad', admin: { width: '50%' } },
            { name: 'lng', type: 'number', required: true, label: 'Lengdegrad', admin: { width: '50%' } },
          ],
        },
        {
          name: 'cameras',
          type: 'array',
          label: 'Kameraer',
          fields: [
            { name: 'url', type: 'text', required: true, label: 'Bilde-URL' },
            { name: 'camTitle', type: 'text', required: true, label: 'Kameratittel' },
            { name: 'source', type: 'text', required: true, label: 'Kilde' },
          ],
        },
      ],
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – kamera, vær og liste', value: 'full' },
        { label: 'Kompakt – kun kamera', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const CurrencyBlock: Block = {
  slug: 'currency',
  labels: { singular: 'Valuta & råvarer', plural: 'Valuta & råvarer' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'show',
      type: 'select',
      hasMany: true,
      label: 'Vis',
      admin: { description: 'La stå tomt for alle fire.' },
      options: [
        { label: 'USD/NOK', value: 'usd' },
        { label: 'EUR/NOK', value: 'eur' },
        { label: 'Bitcoin / USD', value: 'btc' },
        { label: 'Brent råolje (USD/fat)', value: 'brent' },
      ],
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – pris og daglig endring', value: 'full' },
        { label: 'Kompakt – kun pris', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const AnbudBlock: Block = {
  slug: 'anbud',
  labels: { singular: 'Offentlige anbud', plural: 'Offentlige anbud' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall anbud',
      defaultValue: 5,
      min: 1,
      max: 20,
      admin: { description: '1–20 aktive anbud fra Doffin.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – tittel, oppdragsgiver og frist', value: 'full' },
        { label: 'Kompakt – tittel og frist', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const HolidaysBlock: Block = {
  slug: 'holidays',
  labels: { singular: 'Kalender', plural: 'Kalender' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall helligdager',
      defaultValue: 5,
      min: 1,
      max: 20,
      admin: { description: '1–20 kommende norske helligdager.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – kalender med prikker og dagklikk', value: 'full' },
        { label: 'Kompakt – kalender med prikker, dagklikk åpner /arrangementer', value: 'kompakt' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showEvents',
          type: 'checkbox',
          defaultValue: true,
          label: 'Vis arrangementer',
          admin: { width: '33%', description: 'Blå prikker i kalendergriden.' },
        },
        {
          name: 'showTenders',
          type: 'checkbox',
          defaultValue: true,
          label: 'Vis anbudsfrister',
          admin: { width: '33%', description: 'Gule prikker i kalendergriden.' },
        },
        {
          name: 'showJobs',
          type: 'checkbox',
          defaultValue: true,
          label: 'Vis stillingsfrister',
          admin: { width: '34%', description: 'Grønne prikker i kalendergriden.' },
        },
      ],
    },
    breddeField,
  ],
}

export const HistorierBlock: Block = {
  slug: 'historier',
  labels: { singular: 'Siste leserinnlegg', plural: 'Siste leserinnlegg' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall leserinnlegg',
      defaultValue: 3,
      min: 1,
      max: 20,
      admin: { description: '1–20 siste publiserte leserinnlegg.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – bilde, tittel og dato', value: 'full' },
        { label: 'Kompakt – tittel og dato', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const SkipstrafikkBlock: Block = {
  slug: 'skipstrafikk',
  labels: { singular: 'Skipstrafikk (NAIS)', plural: 'Skipstrafikk (NAIS)' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'hoyde',
      type: 'radio',
      label: 'Høyde på kart',
      defaultValue: 'normal',
      options: [
        { label: 'Normal – 420 px desktop', value: 'normal' },
        { label: 'Lav – 300 px desktop', value: 'lav' },
      ],
    },
    breddeField,
  ],
}

export const ArrangementerBlock: Block = {
  slug: 'arrangementer',
  labels: { singular: 'Kommende arrangementer', plural: 'Kommende arrangementer' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall arrangementer',
      defaultValue: 5,
      min: 1,
      max: 20,
      admin: { description: '1–20 kommende arrangementer.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – dato, tittel og sted', value: 'full' },
        { label: 'Kompakt – dato og tittel', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const FergeBlock: Block = {
  slug: 'ferge',
  labels: { singular: 'Ferger og hurtigbåt', plural: 'Ferger og hurtigbåt' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'stops',
      type: 'select',
      hasMany: true,
      label: 'Kaier som vises',
      admin: { description: 'La stå tomt for alle Helgeland-kaier.' },
      options: [
        { label: 'Sandnessjøen hurtigbåtkai', value: 'NSR:StopPlace:49452' },
        { label: 'Sandnessjøen ferjekai',     value: 'NSR:StopPlace:47666' },
        { label: 'Nesna kai',                 value: 'NSR:StopPlace:59239' },
        { label: 'Tjøtta kai',                value: 'NSR:StopPlace:63216' },
        { label: 'Levang ferjekai',           value: 'NSR:StopPlace:47674' },
        { label: 'Herøy ferjekai',            value: 'NSR:StopPlace:47440' },
        { label: 'Brønnøysund hurtigbåtkai',  value: 'NSR:StopPlace:48835' },
        { label: 'Træna hurtigbåtkai',        value: 'NSR:StopPlace:50291' },
        { label: 'Træna ferjekai',            value: 'NSR:StopPlace:47694' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      label: 'Avganger per kai',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: { description: '1–10 avganger per kai (full), alltid maks 3 i kompakt.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – slider med avgangsliste (5 avganger)', value: 'full' },
        { label: 'Kompakt – slider med tettere linjer (3 avganger)', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const PolitiloggBlock: Block = {
  slug: 'politilogg',
  labels: { singular: 'Politiloggen Helgeland', plural: 'Politiloggen Helgeland' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'count',
      type: 'number',
      label: 'Antall meldinger',
      defaultValue: 5,
      min: 1,
      max: 20,
      admin: { description: '1–20 siste politimeldinger fra Helgeland-kommunene.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – kategori, sted, tid og tekst (3 linjer)', value: 'full' },
        { label: 'Kompakt – kategori, sted og tekst (1 linje)', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const KunngjoringerBlock: Block = {
  slug: 'kunngjoringer',
  labels: { singular: 'Kunngjøringer og høringer', plural: 'Kunngjøringer og høringer' },
  fields: [
    { name: 'title', type: 'text', label: 'Tittel (valgfritt)' },
    {
      name: 'kommuner',
      type: 'select',
      hasMany: true,
      label: 'Kommuner',
      admin: { description: 'La stå tomt for alle tilgjengelige kommuner (Rana, Hemnes, Alstahaug).' },
      options: [
        { label: 'Rana', value: 'rana' },
        { label: 'Hemnes', value: 'hemnes' },
        { label: 'Alstahaug', value: 'alstahaug' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      label: 'Antall saker',
      defaultValue: 8,
      min: 1,
      max: 20,
      admin: { description: '1–20 saker, sortert nyest først på tvers av kommuner.' },
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – dato, kommune og tittel', value: 'full' },
        { label: 'Kompakt – én linje per sak', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const EksterneArtiklerBlock: Block = {
  slug: 'eksterneArtikler',
  labels: { singular: 'Artikler fra Midt-Norge', plural: 'Artikler fra Midt-Norge' },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tittel (valgfritt)',
      admin: { description: 'Standard: «Fra Midt-Norge»' },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Datakilde',
      defaultValue: 'api',
      options: [
        { label: 'WordPress API — henter siste N artikler automatisk', value: 'api' },
        { label: 'Manuelle URL-er — OG-data hentes per lenke', value: 'manual' },
        { label: 'Begge — API + manuelle URL-er kombinert', value: 'begge' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      label: 'Antall fra API',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: { description: '1–10 siste artikler fra WordPress-APIet.' },
    },
    {
      name: 'manualUrls',
      type: 'array',
      label: 'Manuelle artikler (URL-er)',
      admin: { description: 'Lim inn artikkellenker fra midtinorge.no. Tittel, bilde og ingress hentes automatisk.' },
      fields: [
        { name: 'url', type: 'text', required: true, label: 'URL' },
      ],
    },
    {
      name: 'variant',
      type: 'radio',
      label: 'Visning',
      defaultValue: 'full',
      options: [
        { label: 'Full – bilde, tittel, ingress og dato', value: 'full' },
        { label: 'Kompakt – tittel og dato', value: 'kompakt' },
      ],
    },
    breddeField,
  ],
}

export const layoutBlocks = [
  HeroBlock,
  RichTextBlock,
  FeaturedPostsBlock,
  BusinessListBlock,
  EventListBlock,
  CTABlock,
  PowerPricesBlock,
  WeatherBlock,
  FlightsBlock,
  NavJobsBlock,
  AnbudBlock,
  NewsBlock,
  BrregBlock,
  WebcamBlock,
  CurrencyBlock,
  HolidaysBlock,
  HistorierBlock,
  ArrangementerBlock,
  SkipstrafikkBlock,
  PolitiloggBlock,
  FergeBlock,
  KunngjoringerBlock,
  EksterneArtiklerBlock,
]

export const widgetBlocks = [
  PowerPricesBlock,
  WeatherBlock,
  FlightsBlock,
  NavJobsBlock,
  AnbudBlock,
  NewsBlock,
  BrregBlock,
  WebcamBlock,
  CurrencyBlock,
  HolidaysBlock,
  HistorierBlock,
  ArrangementerBlock,
  SkipstrafikkBlock,
  PolitiloggBlock,
  FergeBlock,
  KunngjoringerBlock,
  EksterneArtiklerBlock,
]
