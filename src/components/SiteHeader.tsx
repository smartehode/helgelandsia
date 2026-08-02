import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'
import { NaeringslivDropdown } from '@/components/NaeringslivDropdown'
import { MobileNav } from '@/components/MobileNav'

// Nav-strukturen er hardkodet her fordi den inneholder en dropdown (Næringsliv)
// som en flat CMS-liste ikke kan representere. Admin → Meny (topp) påvirker
// dermed ikke lenger navigasjonen — endringer gjøres her i koden.
const LINK_CLS = 'text-sm font-medium text-ink/70 transition hover:text-sea'

export async function SiteHeader() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' }).catch(() => null)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-fog/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

        {/* Logo */}
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-fjord">
          {(settings as any)?.siteName ?? 'Helgelandsia'}
        </Link>

        {/* Desktop-meny */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Hovedmeny">
          <Link href="/"              className={LINK_CLS}>Startside</Link>
          <Link href="/leserinnlegg" className={LINK_CLS}>Leserinnlegg</Link>
          <NaeringslivDropdown />
          <Link href="/arrangementer" className={LINK_CLS}>Arrangementer</Link>
          <Link href="/oppdrag"       className={LINK_CLS}>Oppdrag</Link>
          <Link href="/om"            className={LINK_CLS}>Om oss</Link>
          <Link href="/min-side"      className={LINK_CLS}>Min side</Link>
        </nav>

        {/* Mobil-hamburgermeny */}
        <MobileNav />
      </div>
    </header>
  )
}
