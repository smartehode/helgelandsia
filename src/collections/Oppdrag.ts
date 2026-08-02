import type { CollectionConfig } from 'payload'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { afterChangeApproved } from '../lib/email/submission-approved'
import { CATEGORY_SELECT_OPTIONS, getCategoryById } from '../lib/businesses/categories'
import { KOMMUNENAVN_LC } from '../lib/helgeland/kommuner'

const kommuneOptions = [...KOMMUNENAVN_LC].sort().map(navn => ({
  label: navn.charAt(0).toUpperCase() + navn.slice(1),
  value: navn,
}))

// Felt-nivå: kun redaktører/admin kan lese kontaktinfo og interesseliste
const isEditorField = ({ req }: any) =>
  Boolean(req?.user?.roles?.some((r: string) => r === 'admin' || r === 'editor'))

// Hook: varsler bedrifter med mottarOppdrag=true når oppdrag publiseres.
// Aktiveres kun med OPPDRAG_VARSLING_ENABLED=true (regel 17).
async function notifyBusinesses({ doc, previousDoc, operation, req }: any) {
  if (
    operation !== 'update' ||
    doc._status !== 'published' ||
    previousDoc?._status === 'published'
  ) return

  if (process.env.OPPDRAG_VARSLING_ENABLED !== 'true') return

  try {
    const { oppdragNotificationHtml } = await import('../lib/email/templates')
    const payload = req.payload
    const kategori = doc.kategori as string
    const kommune = doc.kommune as string
    const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://helgelandsia.no'
    const oppdragUrl = `${BASE_URL}/oppdrag/${doc.slug}`
    const catLabel = getCategoryById(kategori)?.label ?? kategori

    const baseWhere = {
      and: [
        { mottarOppdrag: { equals: true } },
        { claimStatus: { equals: 'verified' } },
        { _status: { equals: 'published' } },
        { naceCategory: { equals: kategori } },
      ],
    }

    // Forsøk 1: samme kategori + kommune
    let bizRes: any = await payload.find({
      collection: 'businesses',
      where: { and: [...baseWhere.and, { kommunenavn: { contains: kommune } }] },
      limit: 50, depth: 0, overrideAccess: true,
    })

    // Forsøk 2: same kategori, hele Helgeland (< 3 treff lokalt)
    if (bizRes.docs.length < 3) {
      bizRes = await payload.find({
        collection: 'businesses',
        where: baseWhere,
        limit: 50, depth: 0, overrideAccess: true,
      })
    }

    for (const b of bizRes.docs) {
      if (!b.owner) continue
      const ownerId = typeof b.owner === 'object' ? b.owner?.id : b.owner
      // NaN-guard (regel 10)
      if (!Number.isInteger(Number(ownerId)) || Number(ownerId) <= 0) continue
      const member: any = await payload.findByID({
        collection: 'members', id: ownerId, depth: 0,
      })
      if (!member?.email) continue
      await payload.sendEmail({
        to: member.email,
        subject: `Nytt lokalt oppdrag: ${doc.tittel}`,
        html: oppdragNotificationHtml({
          bedriftNavn: b.name,
          tittel: doc.tittel,
          katLabel: catLabel,
          kommune,
          onsketTidsrom: doc.onsketTidsrom ?? null,
          beskrivelseKort: (doc.beskrivelse ?? '').slice(0, 200),
          oppdragUrl,
        }),
      })
    }
  } catch (err: any) {
    req.payload.logger.error({ msg: 'notifyBusinesses (oppdrag) failed', err })
  }
}

export const Oppdrag: CollectionConfig = {
  slug: 'oppdrag',
  labels: { singular: 'Oppdrag', plural: 'Oppdrag' },
  admin: {
    useAsTitle: 'tittel',
    defaultColumns: ['tittel', 'kategori', 'kommune', '_status', 'createdAt'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [afterChangeApproved('oppdrag'), notifyBusinesses],
  },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    // Innsendt av — skjult fra offentlig API (kun innloggede ser det)
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'members',
      label: 'Innsendt av',
      admin: { position: 'sidebar' },
      access: { read: ({ req: { user } }: any) => Boolean(user) },
    },
    { name: 'tittel', type: 'text', required: true, label: 'Tittel' },
    { name: 'beskrivelse', type: 'textarea', label: 'Beskrivelse' },
    {
      name: 'kategori',
      type: 'select',
      label: 'Kategori / bransje',
      required: true,
      options: CATEGORY_SELECT_OPTIONS,
    },
    {
      name: 'kommune',
      type: 'select',
      label: 'Kommune',
      required: true,
      options: kommuneOptions,
    },
    {
      name: 'onsketTidsrom',
      type: 'text',
      label: 'Ønsket tidsrom (valgfritt)',
      admin: { placeholder: 'F.eks. «Innen utgangen av august» eller «Snarest»' },
    },
    // Kontaktinfo — ALDRI i offentlig API (kun redaktører)
    {
      name: 'kontaktEpost',
      type: 'email',
      label: 'Kontakt-e-post',
      admin: { position: 'sidebar' },
      access: { read: isEditorField },
    },
    {
      name: 'kontaktTelefon',
      type: 'text',
      label: 'Kontakttelefon',
      admin: { position: 'sidebar' },
      access: { read: isEditorField },
    },
    // Interesserte bedrifter — kun redaktører ser listen
    {
      name: 'interessert',
      type: 'array',
      label: 'Interesserte bedrifter',
      admin: { position: 'sidebar' },
      access: { read: isEditorField },
      fields: [
        // Steg 1: velg bransje → bedriftslisten filtreres automatisk
        {
          name: 'bransje',
          type: 'select',
          label: 'Bransje',
          required: true,
          options: CATEGORY_SELECT_OPTIONS,
          admin: {
            description: 'Velg bransje — bedriftslisten filtreres automatisk.',
          },
        },
        // Steg 2: velg bedrift (filtrert på valgt bransje ovenfor)
        {
          name: 'bedrift',
          type: 'relationship',
          relationTo: 'businesses',
          label: 'Bedrift',
          required: true,
          filterOptions: ({ siblingData }: any) => {
            const bransje = (siblingData as any)?.bransje
            if (!bransje) return false
            return { naceCategory: { equals: bransje } }
          },
          admin: {
            allowCreate: false,
            description: 'Velg bransje ovenfor for å filtrere bedriftslisten.',
          },
        },
      ],
    },
    // Slug — settes av innsendingsruten
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
  ],
}
