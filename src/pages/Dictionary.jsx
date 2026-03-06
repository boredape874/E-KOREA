import { useState, useMemo, useCallback, useRef } from 'react'
import glossaryRaw from '../data/glossary.json'
import TermCard from '../components/TermCard'
import './Dictionary.css'

const CATEGORY_COLORS = {
  '경영': { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' },
  '경제': { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  '금융': { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' },
  '공공': { bg: '#F5F3FF', border: '#7C3AED', text: '#6D28D9' },
  '과학': { bg: '#FEFCE8', border: '#CA8A04', text: '#A16207' },
  '사회': { bg: '#FEF2F2', border: '#DC2626', text: '#B91C1C' },
}

const CATEGORIES = ['전체', '경영', '경제', '금융', '공공', '과학', '사회']
const PAGE_SIZE = 20

export default function Dictionary() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const searchRef = useRef()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return glossaryRaw.filter(item => {
      const catMatch = category === '전체' || item.category === category
      if (!q) return catMatch
      return catMatch && (
        item.term.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [search, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value)
    setPage(1)
    setExpanded(null)
  }, [])

  const handleCategory = useCallback((cat) => {
    setCategory(cat)
    setPage(1)
    setExpanded(null)
  }, [])

  const handleClear = useCallback(() => {
    setSearch('')
    searchRef.current?.focus()
    setPage(1)
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = { '전체': glossaryRaw.length }
    CATEGORIES.slice(1).forEach(cat => {
      counts[cat] = glossaryRaw.filter(i => i.category === cat).length
    })
    return counts
  }, [])

  return (
    <div className="dict">
      {/* Search bar */}
      <div className="search-wrap">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            className="search-input"
            placeholder="용어 또는 설명 검색..."
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button className="search-clear" onClick={handleClear} aria-label="초기화">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="cat-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-btn${category === cat ? ' active' : ''}`}
            style={category === cat && cat !== '전체' ? {
              background: CATEGORY_COLORS[cat].bg,
              borderColor: CATEGORY_COLORS[cat].border,
              color: CATEGORY_COLORS[cat].text
            } : {}}
            onClick={() => handleCategory(cat)}
          >
            {cat}
            <span className="cat-count">{categoryCounts[cat]?.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Result count */}
      <div className="result-info">
        {search || category !== '전체' ? (
          <span><strong>{filtered.length.toLocaleString()}</strong>개 결과</span>
        ) : (
          <span>총 <strong>{glossaryRaw.length.toLocaleString()}</strong>개 용어</span>
        )}
        {totalPages > 1 && (
          <span className="page-info">{page} / {totalPages} 페이지</span>
        )}
      </div>

      {/* Term list */}
      {paginated.length === 0 ? (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>검색 결과가 없습니다.</p>
          <button className="btn-outline" onClick={handleClear}>검색 초기화</button>
        </div>
      ) : (
        <div className="term-list">
          {paginated.map(item => (
            <TermCard
              key={item.id}
              item={item}
              color={CATEGORY_COLORS[item.category]}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              highlight={search.trim()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} total={totalPages} onChange={p => { setPage(p); setExpanded(null); window.scrollTo(0, 0) }} />
      )}
    </div>
  )
}

function Pagination({ page, total, onChange }) {
  const pages = []
  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(total, page + delta)

  if (left > 1) pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('...')
  if (right < total) pages.push(total)

  return (
    <div className="pagination">
      <button className="pg-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="pg-ellipsis">…</span>
        ) : (
          <button key={p} className={`pg-btn${p === page ? ' current' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        )
      )}
      <button className="pg-btn" disabled={page === total} onClick={() => onChange(page + 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}
