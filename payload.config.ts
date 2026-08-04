import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
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
import { PressReleases } from './src/collections/PressReleases'
import { Newsletters } from './src/collections/Newsletters'
import { Ads } from './src/collections/Ads'
import { Pages } from './src/collections/Pages'
import { Members } from './src/collections/Members'
import { BRREGSyncJobs } from './src/collections/BRREGSyncJobs'
import { Tenders } from './src/collections/Tenders'
import { Regnskap } from './src/collections/Regnskap'
import { Oppdrag } from './src/collections/Oppdrag'
import { Abonnenter } from './src/collections/Abonnenter'
import { googleOAuth } from './src/oauth/google'

// Globals
import { SiteSettings } from './src/globals/SiteSettings'
import { Header, Footer } from './src/globals/Navigation'
import { Hero } from './src/globals/Hero'
import { WidgetAreas } from './src/globals/Sidebar'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Parser "Navn <adresse@dom.no>" → { name, address }.
// Faller tilbake til Resend sandbox-adresse hvis env mangler, så adapteren alltid lastes.
function parseEmailFrom(raw?: string): { name: string; address: string } {
  const m = raw?.match(/^(.+?)\s*<([^>]+)>$/)
  if (m) return { name: m[1].trim(), address: m[2].trim() }
  if (raw?.includes('@')) return { name: 'Helgelandsia', address: raw.trim() }
  return { name: 'Helgelandsia', address: 'onboarding@resend.dev' }
}
const { name: fromName, address: fromAddress } = parseEmailFrom(process.env.EMAIL_FROM)

const DEFAULT_NAV = [
  { label: 'Arrangementer', url: '/arrangementer' },
  { label: 'Historier', url: '/historier' },
  { label: 'Bedrifter', url: '/bedrifter' },
  { label: 'Stillinger', url: '/stillinger' },
  { label: 'Pressemeldinger', url: '/pressemeldinger' },
  { label: 'Nyhetsbrev', url: '/nyhetsbrev' },
  { label: 'Anbud', url: '/anbud' },
  { label: 'Min side', url: '/min-side' },
]

export default buildConfig({
  onInit: async (payload) => {
    payload.logger.info(`Email adapter: Resend, from=${fromName} <${fromAddress}>`)
    const header = await payload.findGlobal({ slug: 'header' })
    if (!header?.items?.length) {
      await payload.updateGlobal({ slug: 'header', data: { items: DEFAULT_NAV } })
    }
  },
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
    components: {
      beforeDashboard: ['@/components/admin/PendingOverview'],
      beforeNavLinks: ['@/components/admin/PendingNavBadges'],
    },
  },

  // ---- Standard rik-tekst-editor ----
  editor: lexicalEditor(),

  // ---- E-post (Resend — alltid registrert; uten API-nøkkel logges advarsel men Payload tier) ----
  email: resendAdapter({
    defaultFromAddress: fromAddress,
    defaultFromName: fromName,
    apiKey: process.env.RESEND_API_KEY || '',
  }),

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
    PressReleases,
    Newsletters,
    Ads,
    Pages,
    BRREGSyncJobs,
    Tenders,
    Regnskap,
    Oppdrag,
    Abonnenter,
  ],
  globals: [SiteSettings, Hero, Header, Footer, WidgetAreas],

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
  graphQL: {
  disable: true,
},

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
