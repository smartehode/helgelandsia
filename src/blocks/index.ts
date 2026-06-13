import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

// Gjenbrukbare layout-blokker for fleksible sider.
// Redaktøren stabler disse i ønsket rekkefølge i adminpanelet.

export const HeroBlock: Block = {
  slug: 'hero',
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
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Tekstseksjon', plural: 'Tekstseksjoner' },
  fields: [
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true },
  ],
}

export const FeaturedPostsBlock: Block = {
  slug: 'featuredPosts',
  labels: { singular: 'Fremhevede historier', plural: 'Fremhevede historier' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: 'Velg artikler',
    },
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
  ],
}

export const EventListBlock: Block = {
  slug: 'eventList',
  labels: { singular: 'Arrangementsliste', plural: 'Arrangementslister' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    { name: 'limit', type: 'number', defaultValue: 6, label: 'Antall' },
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
        { label: 'Full – dato, navn og dager til', value: 'full' },
        { label: 'Kompakt – navn og dager til', value: 'kompakt' },
      ],
    },
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
  NewsBlock,
  BrregBlock,
  WebcamBlock,
  CurrencyBlock,
  HolidaysBlock,
]

export const widgetBlocks = [
  PowerPricesBlock,
  WeatherBlock,
  FlightsBlock,
  NavJobsBlock,
  NewsBlock,
  BrregBlock,
  WebcamBlock,
  CurrencyBlock,
  HolidaysBlock,
]
