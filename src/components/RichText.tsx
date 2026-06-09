import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// Renderer Lexical rik-tekst til HTML med prosa-styling.
export function RichText({ data }: { data: SerializedEditorState | null | undefined }) {
  if (!data) return null
  return (
    <div className="prose prose-lg max-w-prose prose-headings:font-serif prose-a:text-brand-600">
      <LexicalRichText data={data} />
    </div>
  )
}
