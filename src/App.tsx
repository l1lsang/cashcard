import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import serviceImage from './assets/image.png'
import { saveConsultationApplication } from './services/consultationApplications'
import './App.css'

type CardType = '신용카드' | '법인카드' | '체크카드'
type OverdueStatus = '없음' | '있음'

type FormValues = {
  name: string
  phone: string
  birthDate: string
  overdueStatus: OverdueStatus
  creditLimit: string
  callTime: string
}

type Consultation = {
  id: number
  name: string
  amount: number
  date: string
  time: string
  cardType: CardType
  submittedAt: number
  paid: boolean
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const initialForm: FormValues = {
  name: '',
  phone: '',
  birthDate: '',
  overdueStatus: '없음',
  creditLimit: '',
  callTime: '',
}

const seededAt = Date.now()

const seedConsultations: Consultation[] = [
  {
    id: 8,
    name: '오지훈',
    amount: 80_200_000,
    date: '2026-05-03',
    time: '10:20',
    cardType: '신용카드',
    submittedAt: seededAt - 1000 * 60 * 3,
    paid: true,
  },
  {
    id: 7,
    name: '조민서',
    amount: 60_200_000,
    date: '2026-05-03',
    time: '11:40',
    cardType: '법인카드',
    submittedAt: seededAt - 1000 * 60 * 8,
    paid: true,
  },
  {
    id: 6,
    name: '한도윤',
    amount: 100_000_000,
    date: '2026-05-03',
    time: '13:10',
    cardType: '체크카드',
    submittedAt: seededAt - 1000 * 60 * 14,
    paid: true,
  },
  {
    id: 5,
    name: '박서준',
    amount: 50_200_000,
    date: '2026-05-02',
    time: '17:30',
    cardType: '신용카드',
    submittedAt: seededAt - 1000 * 60 * 22,
    paid: true,
  },
  {
    id: 4,
    name: '한유진',
    amount: 50_700_000,
    date: '2026-05-02',
    time: '15:20',
    cardType: '법인카드',
    submittedAt: seededAt - 1000 * 60 * 31,
    paid: true,
  },
  {
    id: 3,
    name: '서하늘',
    amount: 70_100_000,
    date: '2026-05-01',
    time: '14:30',
    cardType: '법인카드',
    submittedAt: seededAt - 1000 * 60 * 7,
    paid: true,
  },
  {
    id: 2,
    name: '이서연',
    amount: 80_900_000,
    date: '2026-05-02',
    time: '11:00',
    cardType: '신용카드',
    submittedAt: seededAt - 1000 * 60 * 18,
    paid: true,
  },
  {
    id: 1,
    name: '최지우',
    amount: 50_100_000,
    date: '2026-04-30',
    time: '16:00',
    cardType: '체크카드',
    submittedAt: seededAt - 1000 * 60 * 41,
    paid: true,
  },
]

const statItems = [
  {
    value: 88,
    suffix: '억+',
    label: '최근 1년 거래 금액',
    decimals: 0,
  },
  {
    value: 2.5,
    suffix: '만+',
    label: '최근 1년 거래 횟수',
    decimals: 1,
  },
  {
    value: 188,
    suffix: '+',
    label: '하루 평균 거래 횟수',
    decimals: 0,
  },
]

const moneyFormatter = new Intl.NumberFormat('ko-KR')
const syncFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function formatStatValue(value: number, decimals: number, suffix: string) {
  const displayValue =
    decimals > 0
      ? value.toFixed(decimals)
      : moneyFormatter.format(Math.round(value))

  return `${displayValue}${suffix}`
}

function formatAmount(amount: number) {
  if (amount >= 100_000_000) {
    const billionUnit = Math.floor(amount / 100_000_000)
    const remainderManwon = Math.round((amount % 100_000_000) / 10_000)

    if (remainderManwon === 0) {
      return `${moneyFormatter.format(billionUnit)}억`
    }

    return `${moneyFormatter.format(billionUnit)}억 ${moneyFormatter.format(remainderManwon)}만원`
  }

  return `${moneyFormatter.format(Math.round(amount / 10_000))}만원`
}

function formatSubmittedAt(submittedAt: number) {
  const date = new Date(submittedAt)
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${minutes}분`
}

function maskName(name: string) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return '익명'
  }

  return `${trimmedName[0]}**`
}

function App() {
  const trustSectionRef = useRef<HTMLElement | null>(null)
  const [form, setForm] = useState<FormValues>(initialForm)
  const [consultations] = useState<Consultation[]>(seedConsultations)
  const [now, setNow] = useState(seededAt)
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0])
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let frameId = 0
    let hasStarted = false

    const startCounting = () => {
      if (hasStarted) {
        return
      }

      hasStarted = true
      const duration = 1800
      const startedAt = performance.now()

      const tick = (timestamp: number) => {
        const progress = Math.min((timestamp - startedAt) / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        setAnimatedStats(statItems.map((item) => item.value * easedProgress))

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick)
        }
      }

      frameId = window.requestAnimationFrame(tick)
    }

    const section = trustSectionRef.current

    if (!section || !('IntersectionObserver' in window)) {
      startCounting()
      return () => window.cancelAnimationFrame(frameId)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounting()
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitStatus('submitting')

    try {
      await saveConsultationApplication({
        name: form.name.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate,
        overdueStatus: form.overdueStatus,
        creditLimit: form.creditLimit.trim(),
        callTime: form.callTime.trim(),
      })

      setSubmitStatus('success')
      setForm(initialForm)
    } catch (error) {
      console.error(error)
      setSubmitStatus('error')
    }
  }

  return (
    <main className="cashcard-page">
      <section className="hero-section" aria-labelledby="page-title">
        <h1 id="page-title">캐쉬카드 상담 예약</h1>
        <img
          className="hero-image"
          src={serviceImage}
          alt="캐쉬카드 신용카드 법인카드 현금화 상담 서비스"
        />
      </section>

      <section
        className="trust-section"
        ref={trustSectionRef}
        aria-labelledby="trust-title"
      >
        <div className="trust-inner">
          <h2 id="trust-title">많은 고객들이 캐쉬카드와 함께합니다</h2>
          <div className="stat-grid">
            {statItems.map((item, index) => (
              <article className="stat-card" key={item.label}>
                <strong>
                  {formatStatValue(
                    animatedStats[index],
                    item.decimals,
                    item.suffix,
                  )}
                </strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="booking-section" aria-label="상담 예약">
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <p>예약 폼</p>
            <h2>상담신청</h2>
          </div>

          <div className="field-grid">
            <label>
              이름
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="홍길동"
              />
            </label>

            <label>
              연락처
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="010-0000-0000"
              />
            </label>

            <label>
              생년월일
              <input
                required
                type="date"
                value={form.birthDate}
                onChange={(event) =>
                  setForm({ ...form, birthDate: event.target.value })
                }
              />
            </label>

            <fieldset className="choice-field">
              <legend>카드 연체 유/무</legend>
              <div className="segmented-control">
                {(['없음', '있음'] as OverdueStatus[]).map((status) => (
                  <label key={status}>
                    <input
                      checked={form.overdueStatus === status}
                      name="overdueStatus"
                      onChange={() =>
                        setForm({ ...form, overdueStatus: status })
                      }
                      type="radio"
                      value={status}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              신용한도 금액
              <input
                required
                value={form.creditLimit}
                onChange={(event) =>
                  setForm({ ...form, creditLimit: event.target.value })
                }
                placeholder="예: 9000만원"
              />
            </label>

            <label>
              통화 가능시간
              <input
                required
                value={form.callTime}
                onChange={(event) =>
                  setForm({ ...form, callTime: event.target.value })
                }
                placeholder="예: 평일 오후 2시 이후"
              />
            </label>
          </div>

          <button type="submit" disabled={submitStatus === 'submitting'}>
            {submitStatus === 'submitting' ? '신청 중...' : '상담신청'}
          </button>
          {submitStatus === 'success' && (
            <p className="submit-message success">
              신청이 접수되었습니다. 담당자가 확인 후 연락드릴게요.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="submit-message error">
              신청 전송에 실패했습니다. API 환경변수를 확인해 주세요.
            </p>
          )}
        </form>
      </section>

      <section className="history-section" aria-label="상담 신청 내역">
        <div className="list-panel">
          <div className="section-heading">
            <p>실시간 동기화</p>
            <h2>상담신청 내역</h2>
            <span>현재 {syncFormatter.format(now)}</span>
          </div>

          <div className="consultation-list">
            <table className="consultation-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>진행금액</th>
                  <th>신청시간</th>
                  <th>지급완료</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((item) => (
                  <tr key={item.id}>
                    <td>{maskName(item.name)}</td>
                    <td>{formatAmount(item.amount)}</td>
                    <td>{formatSubmittedAt(item.submittedAt)}</td>
                    <td>
                      <span className="payment-status">
                        {item.paid ? '완료' : '대기'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
