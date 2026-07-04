'use client'

import { useState } from 'react'

interface Props {
  slug: string
  hasPhone: boolean
  hasEmail: boolean
}

type ContactData = { phone: string | null; email: string | null }

export function KontaktReveal({ slug, hasPhone, hasEmail }: Props) {
  const [data, setData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(false)

  async function reveal() {
    if (data || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bedrift/${encodeURIComponent(slug)}/kontakt`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function RevealBtn({ label }: { label: string }) {
    return (
      <button
        onClick={reveal}
        disabled={loading}
        className="rounded-lg bg-fog px-3 py-1 text-sm font-medium text-sea hover:bg-sea hover:text-white transition-colors disabled:opacity-60"
      >
        {loading ? 'Henter…' : label}
      </button>
    )
  }

  if (!hasPhone && !hasEmail) return null

  return (
    <>
      {hasPhone && (
        <p className="text-sm">
          📞{' '}
          {data ? (
            data.phone ? (
              <a href={`tel:${data.phone}`} className="text-sea hover:underline">
                {data.phone}
              </a>
            ) : (
              <span className="text-muted">–</span>
            )
          ) : (
            <RevealBtn label="Vis telefonnummer" />
          )}
        </p>
      )}
      {hasEmail && (
        <p className="text-sm">
          ✉️{' '}
          {data ? (
            data.email ? (
              <a href={`mailto:${data.email}`} className="text-sea hover:underline">
                {data.email}
              </a>
            ) : (
              <span className="text-muted">–</span>
            )
          ) : (
            <RevealBtn label="Vis e-post" />
          )}
        </p>
      )}
    </>
  )
}
