import './TermCard.css'

function highlight(text, query) {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="hl">{part}</mark> : part
  )
}

export default function TermCard({ item, expanded, onToggle, highlight: hl }) {
  return (
    <div className={`term-card${expanded ? ' expanded' : ''}`}>
      <button className="term-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="term-left">
          <span className="term-cat">{item.category}</span>
          <span className="term-name">{highlight(item.term, hl)}</span>
        </div>
        <svg
          className={`term-chevron${expanded ? ' open' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div className="term-body">
          <p className="term-desc">{highlight(item.description, hl)}</p>
        </div>
      )}
    </div>
  )
}
