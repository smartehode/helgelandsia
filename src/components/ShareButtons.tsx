'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const BASE = 'https://helgelandsia.no'

export function ShareButtons({ title }: { title: string }) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const url = `${BASE}${pathname}`

  const popup = (href: string) =>
    window.open(href, '_blank', 'width=640,height=480,noopener,noreferrer')

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btn =
    'inline-flex items-center rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-medium text-ink/60 transition hover:border-sea hover:text-sea'

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}
        className={btn}>
        Facebook
      </button>
      <button
        onClick={() => popup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)}
        className={btn}>
        LinkedIn
      </button>
      <button onClick={copy} className={btn}>
        {copied ? '✓ Kopiert' : 'Kopier lenke'}
      </button>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
        className={btn}>
        E-post
      </a>
    </div>
  )
}
