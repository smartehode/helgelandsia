'use client'
import { useState } from 'react'
import { EventForm } from '@/components/EventForm'
import { ArticleForm } from '@/components/ArticleForm'

const tabs = [
  { id: 'artikkel', label: 'Artikkel' },
  { id: 'arrangement', label: 'Arrangement' },
] as const

export function SubmissionTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('artikkel')
  return (
    <div>
      <div className="mb-5 flex rounded-full bg-ink/5 p-1 text-sm font-medium">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex-1 rounded-full py-2 ${active === t.id ? 'bg-white text-fjord shadow-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'artikkel' ? <ArticleForm /> : <EventForm />}
    </div>
  )
}
