'use client'
import { useState } from 'react'
import { ArticleForm } from '@/components/ArticleForm'
import { EventForm } from '@/components/EventForm'
import { JobForm } from '@/components/JobForm'
import { BusinessForm } from '@/components/BusinessForm'
import { PressReleaseForm } from '@/components/PressReleaseForm'
import { NewsletterForm } from '@/components/NewsletterForm'
import { OppdragForm } from '@/components/OppdragForm'

const tabs = [
  { id: 'artikkel',    label: 'Artikkel' },
  { id: 'arrangement', label: 'Arrangement' },
  { id: 'stilling',   label: 'Stilling' },
  { id: 'bedrift',    label: 'Bedrift' },
  { id: 'pressemelding', label: 'Pressemelding' },
  { id: 'nyhetsbrev', label: 'Nyhetsbrev' },
  { id: 'oppdrag',    label: 'Oppdrag' },
] as const

type TabId = (typeof tabs)[number]['id']

interface VerifiedBusiness { id: number; name: string }

export function SubmissionTabs({
  initialTab,
  verifiedBusinesses = [],
}: {
  initialTab?: string
  verifiedBusinesses?: VerifiedBusiness[]
}) {
  const defaultTab = tabs.find(t => t.id === initialTab)?.id ?? 'artikkel'
  const [active, setActive] = useState<TabId>(defaultTab)
  return (
    <div>
      {/* 4 + 3 grid — jevn fordeling for 7 faner */}
      <div className="mb-5 space-y-1">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-ink/5 p-1 text-sm font-medium">
          {tabs.slice(0, 4).map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`rounded-xl py-2 text-xs transition-colors ${active === t.id ? 'bg-white text-fjord shadow-sm' : 'text-muted hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-ink/5 p-1 text-sm font-medium">
          {tabs.slice(4).map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`rounded-xl py-2 text-xs transition-colors ${active === t.id ? 'bg-white text-fjord shadow-sm' : 'text-muted hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {active === 'artikkel' && <ArticleForm />}
      {active === 'arrangement' && <EventForm />}
      {active === 'stilling' && <JobForm />}
      {active === 'bedrift' && <BusinessForm />}
      {active === 'pressemelding' && <PressReleaseForm businesses={verifiedBusinesses} />}
      {active === 'nyhetsbrev' && <NewsletterForm />}
      {active === 'oppdrag' && <OppdragForm />}
    </div>
  )
}
