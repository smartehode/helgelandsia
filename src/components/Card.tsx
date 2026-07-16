import Link from 'next/link'

type CardProps = { href: string; title: string; excerpt?: string | null; imageUrl?: string | null; imageAlt?: string | null; meta?: string | null; badge?: string | null }

export function Card({ href, title, excerpt, imageUrl, imageAlt, meta, badge }: CardProps) {
  return (
    <Link href={href}
      className="group flex flex-col overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_44px_-16px_rgba(12,39,51,0.3)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-fjord/5">
        {imageUrl
          ? <img src={imageUrl} alt={imageAlt ?? title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center"><span className="font-serif text-4xl text-sea/20">H</span></div>}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-sea px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {meta && <span className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-sea">{meta}</span>}
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink transition group-hover:text-sea">{title}</h3>
        {excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{excerpt}</p>}
      </div>
    </Link>
  )
}
