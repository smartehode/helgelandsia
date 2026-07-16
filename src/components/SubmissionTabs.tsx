'use client'
import { useState } from 'react'
import { ArticleForm } from '@/components/ArticleForm'
import { EventForm } from '@/components/EventForm'
import { JobForm } from '@/components/JobForm'
import { BusinessForm } from '@/components/BusinessForm'
import { PressReleaseForm } from '@/components/PressReleaseForm'
import { NewsletterForm } from '@/components/NewsletterForm'

const tabs = [
  { id: 'artikkel', label: 'Artikkel' },
  { id: 'arrangement', label: 'Arrangement' },
  { id: 'stilling', label: 'Stilling' },
  { id: 'bedrift', label: 'Bedrift' },
  { id: 'pressemelding', label: 'Pressemelding' },
  { id: 'nyhetsbrev', label: 'Nyhetsbrev' },
] as const

type TabId = (typeof tabs)[number]['id']

export function SubmissionTabs({ initialTab }: { initialTab?: string }) {
  const defaultTab = tabs.find(t => t.id === initialTab)?.id ?? 'artikkel'
  const [active, setActive] = useState<TabId>(defaultTab)
  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-ink/5 p-1 text-sm font-medium">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`rounded-xl py-2 text-xs transition-colors ${active === t.id ? 'bg-white text-fjord shadow-sm' : 'text-muted hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'artikkel' && <ArticleForm />}
      {active === 'arrangement' && <EventForm />}
      {active === 'stilling' && <JobForm />}
      {active === 'bedrift' && <BusinessForm />}
      {active === 'pressemelding' && <PressReleaseForm />}
      {active === 'nyhetsbrev' && <NewsletterForm />}
    </div>
  )
}
