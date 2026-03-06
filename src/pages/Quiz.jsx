import { useState, useCallback, useRef, useEffect } from 'react'
import glossaryRaw from '../data/glossary.json'
import './Quiz.css'

const CATEGORIES = ['전체', '경영', '경제', '금융', '공공', '과학', '사회']
const CATEGORY_COLORS = {
  '경영': { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' },
  '경제': { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  '금융': { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' },
  '공공': { bg: '#F5F3FF', border: '#7C3AED', text: '#6D28D9' },
  '과학': { bg: '#FEFCE8', border: '#CA8A04', text: '#A16207' },
  '사회': { bg: '#FEF2F2', border: '#DC2626', text: '#B91C1C' },
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

// 괄호(한글/영문) 안 내용을 모두 제거한 핵심 용어 반환
function stripParens(term) {
  return term.replace(/[(\[（【][^)\]）】]*[)\]）】]/g, '').replace(/\s+/g, ' ').trim()
}

// Check if answer is correct — 괄호 안 내용 무시
function checkAnswer(userAnswer, correctTerm) {
  const a = normalize(userAnswer)
  const b = normalize(correctTerm)
  if (a === b) return true
  const stripped = normalize(stripParens(correctTerm))
  if (stripped && a === stripped) return true
  return false
}

// 설명 텍스트에서 정답 단어(괄호 제거 버전 포함)를 모자이크 처리한 React 노드 배열 반환
function maskTermInDesc(description, term) {
  // 마스킹할 후보: 원본 용어 + 괄호 제거 버전
  const candidates = [term, stripParens(term)].filter(Boolean)
  const unique = [...new Set(candidates)].filter(s => s.length > 0)

  // 가장 긴 것부터 매칭해서 겹침 방지
  unique.sort((a, b) => b.length - a.length)

  // 정규식 패턴 생성 (대소문자 무시, 특수문자 이스케이프)
  const escaped = unique.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')

  const parts = description.split(pattern)
  return parts.map((part, i) =>
    pattern.test(part)
      ? <span key={i} className="desc-mask">{'■'.repeat(Math.max(1, part.length))}</span>
      : part
  )
}

const QUIZ_SIZE = 10

export default function Quiz() {
  const [category, setCategory] = useState('전체')
  const [questions, setQuestions] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef()

  const pool = useCallback((cat) => {
    if (cat === '전체') return glossaryRaw
    return glossaryRaw.filter(i => i.category === cat)
  }, [])

  const startQuiz = useCallback((cat) => {
    const items = pickRandom(pool(cat), QUIZ_SIZE)
    setQuestions(items)
    setCurrent(0)
    setAnswer('')
    setSubmitted(false)
    setResults([])
    setFinished(false)
    setShowHint(false)
  }, [pool])

  const handleCategoryStart = (cat) => {
    setCategory(cat)
    startQuiz(cat)
  }

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted) return
    const correct = checkAnswer(answer, questions[current].term)
    setSubmitted(true)
    setResults(prev => [...prev, { item: questions[current], userAnswer: answer, correct }])
  }, [answer, submitted, questions, current])

  const handleNext = useCallback(() => {
    const nextIdx = current + 1
    if (nextIdx >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(nextIdx)
      setAnswer('')
      setSubmitted(false)
      setShowHint(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [current, questions])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (!submitted) handleSubmit()
      else handleNext()
    }
  }, [submitted, handleSubmit, handleNext])

  useEffect(() => {
    if (questions && !submitted && !finished) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [current, questions, submitted, finished])

  // ── Landing / category select ──
  if (!questions) {
    return (
      <div className="quiz-landing">
        <div className="quiz-hero">
          <div className="quiz-hero-icon">?</div>
          <h1 className="quiz-hero-title">시사경제 용어 퀴즈</h1>
          <p className="quiz-hero-desc">
            설명을 읽고 해당하는 용어를 직접 입력하세요.<br />
            총 {QUIZ_SIZE}문제가 출제됩니다.
          </p>
        </div>

        <div className="quiz-cat-grid">
          {CATEGORIES.map(cat => {
            const count = cat === '전체' ? glossaryRaw.length : glossaryRaw.filter(i => i.category === cat).length
            const color = CATEGORY_COLORS[cat]
            return (
              <button
                key={cat}
                className="quiz-cat-card"
                style={cat !== '전체' ? { borderColor: color.border } : {}}
                onClick={() => handleCategoryStart(cat)}
              >
                <span
                  className="quiz-cat-badge"
                  style={cat !== '전체' ? { background: color.bg, color: color.text, borderColor: color.border } : {}}
                >
                  {cat}
                </span>
                <span className="quiz-cat-count">{count.toLocaleString()}개</span>
                <span className="quiz-cat-label">문제 시작 →</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Finished screen ──
  if (finished) {
    const score = results.filter(r => r.correct).length
    const pct = Math.round((score / QUIZ_SIZE) * 100)
    const grade = pct >= 90 ? '🏆 완벽!' : pct >= 70 ? '👏 우수' : pct >= 50 ? '💪 보통' : '📚 분발'

    return (
      <div className="quiz-result">
        <div className="result-header">
          <div className="result-grade">{grade}</div>
          <h2 className="result-title">{score} / {QUIZ_SIZE} 정답</h2>
          <div className="result-bar-wrap">
            <div className="result-bar">
              <div className="result-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="result-pct">{pct}%</span>
          </div>
        </div>

        <div className="result-list">
          {results.map((r, i) => (
            <div key={i} className={`result-item ${r.correct ? 'ok' : 'fail'}`}>
              <div className="result-item-header">
                <span className={`result-badge ${r.correct ? 'ok' : 'fail'}`}>
                  {r.correct ? '✓ 정답' : '✗ 오답'}
                </span>
                <span className="result-term">{r.item.term}</span>
              </div>
              {!r.correct && (
                <div className="result-user-answer">내 답: <em>{r.userAnswer || '(미입력)'}</em></div>
              )}
              <p className="result-desc-preview">{r.item.description.slice(0, 120)}…</p>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="btn-primary" onClick={() => startQuiz(category)}>
            같은 카테고리 재시작
          </button>
          <button className="btn-outline" onClick={() => setQuestions(null)}>
            카테고리 변경
          </button>
        </div>
      </div>
    )
  }

  // ── Active quiz ──
  const q = questions[current]
  const color = CATEGORY_COLORS[q.category]
  const coreTerm = stripParens(q.term)
  const hint = coreTerm.length >= 2 ? coreTerm[0] + '_'.repeat(coreTerm.length - 1) : coreTerm[0]
  const isCorrect = submitted && checkAnswer(answer, q.term)
  // 퀴즈 중: 설명 전체 표시, 정답 단어 마스킹
  const descContent = submitted ? q.description : maskTermInDesc(q.description, q.term)

  return (
    <div className="quiz-active">
      {/* Progress */}
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(current / QUIZ_SIZE) * 100}%` }} />
        </div>
        <div className="quiz-progress-meta">
          <span style={{ color: color?.text, background: color?.bg, border: `1.5px solid ${color?.border}` }} className="quiz-cat-tag">
            {q.category}
          </span>
          <span className="quiz-counter">{current + 1} / {QUIZ_SIZE}</span>
        </div>
      </div>

      {/* Description card */}
      <div className="quiz-card" style={{ borderColor: submitted ? (isCorrect ? '#16A34A' : '#DC2626') : color?.border }}>
        <div className="quiz-card-label">이 용어는 무엇일까요?</div>
        <p className="quiz-card-desc">{descContent}</p>
      </div>

      {/* Hint */}
      {!submitted && (
        <div className="quiz-hint-row">
          {!showHint ? (
            <button className="hint-btn" onClick={() => setShowHint(true)}>
              힌트 보기 (첫 글자)
            </button>
          ) : (
            <div className="hint-text">
              힌트: <strong>{hint}</strong> ({q.term.length}글자)
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="quiz-input-wrap">
        <div className={`quiz-input-box${submitted ? (isCorrect ? ' correct' : ' wrong') : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="quiz-input"
            placeholder="용어를 입력하세요..."
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
        {!submitted ? (
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            제출 (Enter)
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext}>
            {current + 1 < QUIZ_SIZE ? '다음 문제 →' : '결과 보기 →'}
          </button>
        )}
        <button className="btn-ghost" onClick={() => setQuestions(null)}>
          종료
        </button>
      </div>

      {/* Score track */}
      <div className="quiz-score-track">
        {results.map((r, i) => (
          <span key={i} className={`score-dot ${r.correct ? 'ok' : 'fail'}`} title={r.item.term} />
        ))}
        {current >= results.length && <span className="score-dot current" />}
        {Array.from({ length: QUIZ_SIZE - results.length - 1 }).map((_, i) => (
          <span key={`e${i}`} className="score-dot empty" />
        ))}
      </div>
    </div>
  )
}
