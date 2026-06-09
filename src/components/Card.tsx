import Link from 'next/link'
import Image from 'next/image'

type CardProps = {
  href: string
  title: string
  excerpt?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  meta?: string | null
}

// Gjenbrukbart kort for artikler, bedrifter og arrangementer.
export function Card({ href, title, excerpt, imageUrl, imageAlt, meta }: CardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-sand">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {meta && <span className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600">{meta}</span>}
        <h3 className="font-serif text-lg font-semibold text-sea group-hover:text-brand-700">{title}</h3>
        {excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{excerpt}</p>}
      </div>
    </Link>
  )
}
