import { useState, useCallback, useRef, useEffect } from 'react'
import glossaryRaw from '../data/glossary.json'
import './Quiz.css'

const CATEGORIES = ['전체', '경영', '경제', '금융', '공공', '과학', '사회']

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }
function normalize(str) { return str.trim().toLowerCase().replace(/\s+/g, '') }
function stripParens(term) {
  return term.replace(/[(\[（【][^)\]）】]*[)\]）】]/g, '').replace(/\s+/g, ' ').trim()
}
function checkAnswer(userAnswer, correctTerm) {
  const a = normalize(userAnswer)
  if (a === normalize(correctTerm)) return true
  const stripped = normalize(stripParens(correctTerm))
  return stripped.length > 0 && a === stripped
}
function maskTermInDesc(description, term) {
  const candidates = [...new Set([term, stripParens(term)])].filter(s => s.length > 0)
  candidates.sort((a, b) => b.length - a.length)
  const pattern = new RegExp(
    `(${candidates.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'
  )
  return description.split(pattern).map((part, i) =>
    pattern.test(part)
      ? <span key={i} className="desc-mask">{'■'.repeat(Math.max(1, part.length))}</span>
      : part
  )
}

export default function Quiz() {
  const [category, setCategory]   = useState(null)
  const [current, setCurrent]     = useState(null)
  const [answer, setAnswer]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint]   = useState(false)
  const [stats, setStats]         = useState({ total: 0, correct: 0, streak: 0, best: 0 })
  const [history, setHistory]     = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const queueRef = useRef([])
  const inputRef = useRef()

  const getPool = useCallback((cat) =>
    cat === '전체' ? glossaryRaw : glossaryRaw.filter(i => i.category === cat)
  , [])

  const nextQuestion = useCallback((cat) => {
    if (queueRef.current.length === 0) queueRef.current = shuffle(getPool(cat))
    setCurrent(queueRef.current.shift())
    setAnswer('')
    setSubmitted(false)
    setShowHint(false)
  }, [getPool])

  const startQuiz = useCallback((cat) => {
    queueRef.current = shuffle(getPool(cat))
    setCategory(cat)
    setCurrent(queueRef.current.shift())
    setAnswer('')
    setSubmitted(false)
    setShowHint(false)
    setStats({ total: 0, correct: 0, streak: 0, best: 0 })
    setHistory([])
    setShowSummary(false)
  }, [getPool])

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted || !current) return
    const correct = checkAnswer(answer, current.term)
    setSubmitted(true)
    setStats(prev => {
      const streak = correct ? prev.streak + 1 : 0
      return { total: prev.total + 1, correct: prev.correct + (correct ? 1 : 0), streak, best: Math.max(prev.best, streak) }
    })
    setHistory(prev => [...prev.slice(-29), { term: current.term, correct }])
  }, [answer, submitted, current])

  const handleNext = useCallback(() => {
    nextQuestion(category)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [nextQuestion, category])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') submitted ? handleNext() : handleSubmit()
  }, [submitted, handleSubmit, handleNext])

  useEffect(() => {
    if (current && !submitted) setTimeout(() => inputRef.current?.focus(), 50)
  }, [current, submitted])

  // ── Landing ──
  if (!category) return (
    <div className="quiz-landing">
      <div className="quiz-hero">
        <div className="quiz-hero-badge">QUIZ</div>
        <h1 className="quiz-hero-title">시사경제 용어 퀴즈</h1>
        <p className="quiz-hero-desc">
          설명을 읽고 용어를 맞춰보세요.<br />
          문제 수 제한 없이 원하는 만큼 계속 풀 수 있습니다.
        </p>
      </div>
      <div className="quiz-cat-grid">
        {CATEGORIES.map(cat => {
          const count = cat === '전체' ? glossaryRaw.length : glossaryRaw.filter(i => i.category === cat).length
          return (
            <button key={cat} className="quiz-cat-card" onClick={() => startQuiz(cat)}>
              <span className="quiz-cat-badge">{cat}</span>
              <div className="quiz-cat-count">{count.toLocaleString()}<span className="quiz-cat-unit">개</span></div>
              <div className="quiz-cat-action">시작하기</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Summary ──
  if (showSummary) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    return (
      <div className="quiz-summary">
        <div className="summary-card">
          <div className="summary-label">세션 결과</div>
          <div className="summary-stat-grid">
            <div className="summary-stat">
              <div className="summary-stat-val">{stats.total}</div>
              <div className="summary-stat-key">총 문제</div>
            </div>
            <div className="summary-stat ok">
              <div className="summary-stat-val">{stats.correct}</div>
              <div className="summary-stat-key">정답</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-val">{pct}%</div>
              <div className="summary-stat-key">정답률</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-val">{stats.best}</div>
              <div className="summary-stat-key">최고 연속</div>
            </div>
          </div>
          <div className="summary-bar-wrap">
            <div className="summary-bar"><div className="summary-bar-fill" style={{ width: `${pct}%` }} /></div>
            <span className="summary-pct">{pct}%</span>
          </div>
        </div>

        {history.length > 0 && (
          <div className="summary-history">
            <div className="summary-history-title">최근 기록</div>
            {[...history].reverse().slice(0, 15).map((h, i) => (
              <div key={i} className={`summary-row ${h.correct ? 'ok' : 'fail'}`}>
                <span className={`summary-row-icon ${h.correct ? 'ok' : 'fail'}`}>{h.correct ? '✓' : '✗'}</span>
                <span className="summary-row-term">{h.term}</span>
              </div>
            ))}
          </div>
        )}

        <div className="quiz-actions">
          <button className="btn-primary" onClick={() => startQuiz(category)}>다시 시작</button>
          <button className="btn-ghost" onClick={() => setCategory(null)}>카테고리 변경</button>
        </div>
      </div>
    )
  }

  // ── Active quiz ──
  const q = current
  const coreTerm = stripParens(q.term).replace(/\s+/g, '')
  const hint = coreTerm.length >= 2 ? coreTerm[0] + '_'.repeat(coreTerm.length - 1) : coreTerm[0]
  const isCorrect = submitted && checkAnswer(answer, q.term)
  const descContent = submitted ? q.description : maskTermInDesc(q.description, q.term)
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null

  return (
    <div className="quiz-active">

      {/* Stats bar */}
      <div className="quiz-stats-bar">
        <div className="quiz-stat-item">
          <span className="quiz-stat-num">{stats.total + 1}</span>
          <span className="quiz-stat-lbl">번째</span>
        </div>
        <div className="quiz-stat-sep" />
        <div className="quiz-stat-item">
          <span className="quiz-stat-num ok">{stats.correct}</span>
          <span className="quiz-stat-lbl">정답</span>
        </div>
        <div className="quiz-stat-sep" />
        <div className="quiz-stat-item">
          <span className="quiz-stat-num">{accuracy !== null ? `${accuracy}%` : '—'}</span>
          <span className="quiz-stat-lbl">정확도</span>
        </div>
        {stats.streak >= 2 && (
          <>
            <div className="quiz-stat-sep" />
            <div className="quiz-stat-item">
              <span className="quiz-stat-num streak">{stats.streak}연속</span>
              <span className="quiz-stat-lbl">정답</span>
            </div>
          </>
        )}
      </div>

      {/* History dots */}
      {history.length > 0 && (
        <div className="quiz-score-track">
          {history.slice(-20).map((h, i) => (
            <span key={i} className={`score-dot ${h.correct ? 'ok' : 'fail'}`} title={h.term} />
          ))}
          <span className="score-dot current" />
        </div>
      )}

      {/* Question card */}
      <div className={`quiz-card${submitted ? (isCorrect ? ' card-correct' : ' card-wrong') : ''}`}>
        <div className="quiz-card-header">
          <span className="quiz-cat-tag">{q.category}</span>
          <span className="quiz-card-label">이 용어는 무엇일까요?</span>
        </div>
        <p className="quiz-card-desc">{descContent}</p>
      </div>

      {/* Hint */}
      {!submitted && (
        <div className="quiz-hint-row">
          {!showHint
            ? <button className="hint-btn" onClick={() => setShowHint(true)}>힌트 보기 (첫 글자)</button>
            : <div className="hint-text">힌트: <strong>{hint}</strong> <span className="hint-len">({q.term.replace(/\s+/g, '').length}글자)</span></div>
          }
        </div>
      )}

      {/* Input */}
      <div className="quiz-input-wrap">
        <div className={`quiz-input-box${submitted ? (isCorrect ? ' correct' : ' wrong') : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="quiz-input"
            placeholder="용어를 입력하고 Enter…"
            value={answer}
            onChange={e => !submitted && setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitted}
          />
          {submitted && (
            <span className={`quiz-result-icon ${isCorrect ? 'ok' : 'fail'}`}>
              {isCorrect ? '✓' : '✗'}
            </span>
          )}
        </div>
        {submitted && !isCorrect && (
          <div className="quiz-answer-reveal">
            정답: <strong>{q.term}</strong>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="quiz-actions">
        {!submitted
          ? <button className="btn-primary" onClick={handleSubmit} disabled={!answer.trim()}>제출 (Enter)</button>
          : <button className="btn-primary" onClick={handleNext}>다음 문제</button>
        }
        <button className="btn-ghost" onClick={() => setShowSummary(true)}>종료 / 결과</button>
      </div>

    </div>
  )
}
