import { useState, useCallback, useEffect, useRef } from 'react'
import glossaryRaw from '../data/glossary.json'
import './Flashcards.css'

const CATEGORIES = ['전체', '경영', '경제', '금융', '공공', '과학', '사회']

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function Flashcards() {
  const [category, setCategory] = useState(null)
  const [deck, setDeck]         = useState([])
  const [index, setIndex]       = useState(0)
  const [flipped, setFlipped]   = useState(false)
  const [known, setKnown]       = useState(new Set())
  const [isShuffled, setIsShuffled] = useState(false)
  const containerRef = useRef()

  const startDeck = useCallback((cat, doShuffle = false) => {
    const pool = cat === '전체' ? glossaryRaw : glossaryRaw.filter(i => i.category === cat)
    setDeck(doShuffle ? shuffle(pool) : [...pool])
    setCategory(cat)
    setIndex(0)
    setFlipped(false)
    setKnown(new Set())
    setIsShuffled(doShuffle)
    setTimeout(() => containerRef.current?.focus(), 50)
  }, [])

  const go = useCallback((dir) => {
    setDeck(prev => {
      const next = index + dir
      if (next < 0 || next >= prev.length) return prev
      setIndex(next)
      setFlipped(false)
      return prev
    })
  }, [index])

  const toggleKnown = useCallback(() => {
    const card = deck[index]
    if (!card) return
    setKnown(prev => {
      const next = new Set(prev)
      next.has(card.id) ? next.delete(card.id) : next.add(card.id)
      return next
    })
  }, [deck, index])

  const toggleShuffle = useCallback(() => {
    if (!category) return
    const pool = category === '전체' ? glossaryRaw : glossaryRaw.filter(i => i.category === category)
    setDeck(!isShuffled ? shuffle(pool) : [...pool])
    setIsShuffled(s => !s)
    setIndex(0)
    setFlipped(false)
  }, [category, isShuffled])

  // Keyboard
  useEffect(() => {
    if (!category) return
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f) }
      else if (e.key === 'k' || e.key === 'K') toggleKnown()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [category, go, toggleKnown])

  // ── Landing ──
  if (!category) return (
    <div className="fc-landing">
      <div className="fc-hero">
        <div className="fc-hero-badge">FLASHCARDS</div>
        <h1 className="fc-hero-title">단어장</h1>
        <p className="fc-hero-desc">
          카드를 클릭하면 뜻이 펼쳐집니다.<br />
          방향키로 넘기고, Space로 뒤집을 수 있습니다.
        </p>
      </div>
      <div className="fc-cat-grid">
        {CATEGORIES.map(cat => {
          const count = cat === '전체' ? glossaryRaw.length : glossaryRaw.filter(i => i.category === cat).length
          return (
            <button key={cat} className="fc-cat-card" onClick={() => startDeck(cat)}>
              <span className="fc-cat-badge">{cat}</span>
              <div className="fc-cat-count">{count.toLocaleString()}<span className="fc-cat-unit">개</span></div>
              <div className="fc-cat-action">학습 시작</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const card = deck[index]
  if (!card) return null

  const progress = Math.round(((index + 1) / deck.length) * 100)
  const isKnown = known.has(card.id)
  const knownCount = known.size

  return (
    <div className="fc-session" ref={containerRef} tabIndex={-1}>

      {/* Top bar */}
      <div className="fc-topbar">
        <button className="fc-back-btn" onClick={() => setCategory(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          카테고리
        </button>
        <div className="fc-progress-wrap">
          <div className="fc-progress-bar">
            <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="fc-progress-text">{index + 1} / {deck.length}</span>
        </div>
        <div className="fc-top-actions">
          {knownCount > 0 && (
            <span className="fc-known-count">{knownCount}개 알아요</span>
          )}
          <button
            className={`fc-shuffle-btn${isShuffled ? ' active' : ''}`}
            onClick={toggleShuffle}
            title="무작위 순서"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="fc-scene" onClick={() => setFlipped(f => !f)}>
        <div className={`fc-card${flipped ? ' flipped' : ''}`}>
          <span className="fc-face-cat">{card.category}</span>
          {flipped ? (
            <>
              <div className="fc-face-desc">{card.description}</div>
              <div className="fc-face-term-small">{card.term}</div>
            </>
          ) : (
            <>
              <div className="fc-face-term">{card.term}</div>
              <div className="fc-flip-hint">클릭하여 뜻 보기</div>
            </>
          )}
        </div>
      </div>

      {/* Known toggle */}
      <div className="fc-known-row">
        <button
          className={`fc-known-btn${isKnown ? ' known' : ''}`}
          onClick={toggleKnown}
        >
          {isKnown ? '알고 있어요' : '알고 있어요'}
          <span className="fc-known-check">{isKnown ? '✓' : ''}</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="fc-nav">
        <button
          className="fc-nav-btn"
          onClick={() => go(-1)}
          disabled={index === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          이전
        </button>

        <div className="fc-nav-dots">
          {deck.slice(Math.max(0, index - 3), Math.min(deck.length, index + 4)).map((c, i) => {
            const realIdx = Math.max(0, index - 3) + i
            return (
              <span
                key={realIdx}
                className={`fc-nav-dot${realIdx === index ? ' current' : ''}${known.has(c.id) ? ' known' : ''}`}
                onClick={() => { setIndex(realIdx); setFlipped(false) }}
              />
            )
          })}
        </div>

        <button
          className="fc-nav-btn"
          onClick={() => go(1)}
          disabled={index === deck.length - 1}
        >
          다음
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="fc-keyboard-hint">
        <span>← → 넘기기</span>
        <span>Space 뒤집기</span>
        <span>K 알아요 표시</span>
      </div>

    </div>
  )
}
