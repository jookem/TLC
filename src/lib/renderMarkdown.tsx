import type { ReactNode } from 'react'

/**
 * Minimal markdown renderer for grammar lesson slides.
 * Supports: **bold**, *italic*, numbered lists (1.), bullet lists (- or *), blank-line paragraphs.
 * Returns an array of React nodes — spread into a container div.
 */

type Span = { bold?: boolean; italic?: boolean; text: string }

function parseInline(text: string): ReactNode[] {
  // Split on **bold** and *italic* markers
  const parts: ReactNode[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[0].startsWith('**')) {
      parts.push(<strong key={key++}>{m[2]}</strong>)
    } else {
      parts.push(<em key={key++}>{m[3]}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function renderMarkdown(src: string, className = ''): ReactNode {
  if (!src.trim()) return null

  // Split into "blocks" separated by blank lines
  const blocks = src.split(/\n{2,}/)
  const nodes: ReactNode[] = []
  let key = 0

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trimEnd())

    // Numbered list: lines starting with digits + dot
    if (lines.every(l => /^\d+\.\s/.test(l))) {
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 pl-1">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>
      )
      continue
    }

    // Bullet list: lines starting with - or * (but not **)
    if (lines.every(l => /^[-*]\s/.test(l) && !l.startsWith('**'))) {
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-1 pl-1">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.replace(/^[-*]\s/, ''))}</li>
          ))}
        </ul>
      )
      continue
    }

    // Mixed block — render line by line with <br> between
    const lineNodes: ReactNode[] = []
    for (let i = 0; i < lines.length; i++) {
      lineNodes.push(...parseInline(lines[i]))
      if (i < lines.length - 1) lineNodes.push(<br key={`br-${key++}`} />)
    }
    nodes.push(<p key={key++}>{lineNodes}</p>)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {nodes}
    </div>
  )
}
