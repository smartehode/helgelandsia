import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { BedriftRedigerForm } from '@/components/BedriftRedigerForm'
import { bizUrl } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rediger bedrift',
  robots: { index: false },
}

function toLexical(text: string) {
  return {
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: null,
      children: text.split(/\n+/).filter(Boolean).map(line => ({
        type: 'paragraph', format: '', indent: 0, version: 1, direction: null,
        children: [{ type: 'text', text: line, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      })),
    },
  }
}

function lexicalToText(lexical: any): string {
  if (!lexical?.root?.children) return ''
  return (lexical.root.children as any[])
    .map((block: any) =>
      (block.children ?? []).map((n: any) => n.text ?? '').join('')
    )
    .filter(Boolean)
    .join('\n')
}

export default async function RedigerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') redirect('/logg-inn')

  const { docs } = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { slug: { equals: slug } },
        { owner: { equals: user.id } },
        { claimStatus: { equals: 'verified' } },
      ],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  const b: any = docs[0]
  if (!b) notFound()

  async function saveBedrift(formData: FormData) {
    'use server'

    const pl = await getPayloadClient()
    const { user: u }: any = await pl.auth({ headers: await getHeaders() })

    // NaN-guard: ingen bruker → avvis umiddelbart
    if (!u || u.collection !== 'members') return

    // Re-sjekk eierskap i DB for å unngå race conditions
    const { docs: fresh } = await pl.find({
      collection: 'businesses',
      where: {
        and: [
          { slug: { equals: slug } },
          { owner: { equals: u.id } },
          { claimStatus: { equals: 'verified' } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    const doc: any = fresh[0]
    if (!doc) return // ikke eier

    // --- Logo ---
    let logoId: number | null =
      doc.logo && typeof doc.logo === 'object' ? doc.logo.id : (doc.logo ?? null)

    const logoFile = formData.get('logo') as File | null
    if (logoFile && logoFile.size > 0) {
      if (!logoFile.type.startsWith('image/')) return
      if (logoFile.size > 8 * 1024 * 1024) return
      const media: any = await pl.create({
        collection: 'media',
        data: { alt: doc.name },
        file: {
          data: Buffer.from(await logoFile.arrayBuffer()),
          name: logoFile.name,
          mimetype: logoFile.type,
          size: logoFile.size,
        },
      })
      logoId = media.id
    }

    // --- Galleri: behold eksisterende + legg til nye ---
    const existingGallery = (doc.gallery ?? [])
      .map((item: any) => ({
        image: item.image && typeof item.image === 'object' ? item.image.id : item.image,
      }))
      .filter((item: any) => item.image != null)

    const galleryFiles = formData.getAll('gallery') as File[]
    const newGallery: any[] = []
    for (const file of galleryFiles) {
      if (!file || file.size === 0 || !file.type.startsWith('image/')) continue
      if (file.size > 8 * 1024 * 1024) continue
      const media: any = await pl.create({
        collection: 'media',
        data: { alt: doc.name },
        file: {
          data: Buffer.from(await file.arrayBuffer()),
          name: file.name,
          mimetype: file.type,
          size: file.size,
        },
      })
      newGallery.push({ image: media.id })
    }

    // --- Beskrivelse (textarea → lexical) ---
    const descText = String(formData.get('description') ?? '').trim()
    const description = descText ? toLexical(descText) : null

    // --- Åpningstider (JSON fra klientkomponent) ---
    let openingHours: any[] = []
    try {
      openingHours = JSON.parse(String(formData.get('openingHours') ?? '[]'))
    } catch {
      openingHours = []
    }

    await pl.update({
      collection: 'businesses',
      id: doc.id,
      data: {
        tagline: String(formData.get('tagline') ?? '') || null,
        description: description as any,
        phone: String(formData.get('phone') ?? '') || null,
        email: String(formData.get('email') ?? '') || null,
        website: String(formData.get('website') ?? '') || null,
        video: String(formData.get('video') ?? '') || null,
        logo: logoId,
        gallery: [...existingGallery, ...newGallery],
        openingHours,
        social: {
          facebook:  String(formData.get('social_facebook')  ?? '') || null,
          instagram: String(formData.get('social_instagram') ?? '') || null,
          linkedin:  String(formData.get('social_linkedin')  ?? '') || null,
          tiktok:    String(formData.get('social_tiktok')    ?? '') || null,
          youtube:   String(formData.get('social_youtube')   ?? '') || null,
        },
        // Berører IKKE: _status, showOnPublicListing, BRREG-felt, owner, claimStatus
      } as any,
      overrideAccess: true,
    })

    redirect('/min-side?redigert=1')
  }

  const descriptionText = lexicalToText(b.description)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/min-side" className="hover:text-sea">Min side</Link>
        <span className="mx-2">›</span>
        <Link href={bizUrl(b)} className="hover:text-sea">{b.name}</Link>
        <span className="mx-2">›</span>
        <span>Rediger</span>
      </nav>

      <h1 className="mb-8 font-serif text-2xl font-bold text-sea">Rediger bedriftsprofil</h1>

      <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
        <BedriftRedigerForm
          business={b}
          action={saveBedrift}
          descriptionText={descriptionText}
        />
      </div>
    </div>
  )
}
