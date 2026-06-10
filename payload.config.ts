import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import { nb } from '@payloadcms/translations/languages/nb'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections
import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Categories } from './src/collections/Categories'
import { Places } from './src/collections/Places'
import { Posts } from './src/collections/Posts'
import { Businesses } from './src/collections/Businesses'
import { Events } from './src/collections/Events'
import { Jobs } from './src/collections/Jobs'
import { Ads } from './src/collections/Ads'
import { Pages } from './src/collections/Pages'
import { Members } from './src/collections/Members'
import { googleOAuth } from './src/oauth/google'

// Globals
import { SiteSettings } from './src/globals/SiteSettings'
import { Header, Footer } from './src/globals/Navigation'
import { Hero } from './src/globals/Hero'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  i18n: {
    supportedLanguages: { en, nb },
    fallbackLanguage: 'nb',
  },
  // ---- Adminpanel ----
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '· Helgeland-portalen',
    },
  },

  // ---- Standard rik-tekst-editor ----
  editor: lexicalEditor(),

  // ---- Datamodell ----
  collections: [
    Users,
    Members,
    Media,
    Categories,
    Places,
    Posts,
    Businesses,
    Events,
    Jobs,
    Ads,
    Pages,
  ],
  globals: [SiteSettings, Hero, Header, Footer],

  // ---- Database ----
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: true,
  }),

  // ---- Bildeprosessering ----
  sharp,

  // ---- Sikkerhet ----
  secret: process.env.PAYLOAD_SECRET || '',
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],

  // ---- Auto-genererte TypeScript-typer (delt med frontend) ----
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },

  // ---- Plugins ----
  plugins: [
    googleOAuth,
    // SEO-felt (meta-tittel, beskrivelse, OG-bilde) på utvalgte collections
    seoPlugin({
      collections: ['posts', 'pages', 'businesses', 'events'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · Helgeland-portalen`,
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.tagline ?? '',
    }),

    // S3-lagring for media – aktiveres kun når miljøvariablene er satt.
    // Uten S3 lagres bilder lokalt i utvikling.
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET,
            config: {
              region: process.env.S3_REGION,
              endpoint: process.env.S3_ENDPOINT || undefined,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
})
