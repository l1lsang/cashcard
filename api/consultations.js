import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const allowedCardTypes = new Set(['신용카드', '법인카드', '체크카드'])

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    const error = new Error(`${name} 환경변수가 설정되지 않았습니다.`)
    error.statusCode = 500
    throw error
  }

  return value
}

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
        clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
    })
  }

  return getFirestore()
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body)
  }

  return req.body || {}
}

function assertString(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`${field} 값이 올바르지 않습니다.`)
    error.statusCode = 400
    throw error
  }

  return value.trim().slice(0, maxLength)
}

function normalizeApplication(rawBody) {
  const cardType = assertString(rawBody.cardType, '카드 종류', 20)
  const amount = assertString(rawBody.amount, '금액', 80)

  if (!allowedCardTypes.has(cardType)) {
    const error = new Error('지원하지 않는 카드 종류입니다.')
    error.statusCode = 400
    throw error
  }

  return {
    name: assertString(rawBody.name, '이름', 30),
    phone: assertString(rawBody.phone, '연락처', 20),
    requestedDate: assertString(rawBody.requestedDate, '예약 날짜', 20),
    requestedTime: assertString(rawBody.requestedTime, '예약 시간', 20),
    amount,
    cardType,
    message: assertString(rawBody.message, '상담내용', 1000),
  }
}

function formatSubmittedAt(value) {
  const date = new Date(value)
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${minutes}분`
}

function buildTelegramMessage(application, clientSubmittedAt) {
  return [
    '[캐쉬카드] 신규 상담신청',
    '',
    `이름: ${application.name}`,
    `연락처: ${application.phone}`,
    `예약 날짜: ${application.requestedDate}`,
    `예약 시간: ${application.requestedTime}`,
    `금액: ${application.amount}`,
    `카드 종류: ${application.cardType}`,
    `신청 시간: ${formatSubmittedAt(clientSubmittedAt)}`,
    '',
    `상담내용: ${application.message}`,
  ].join('\n')
}

async function sendTelegram(application, clientSubmittedAt) {
  const response = await fetch(
    `https://api.telegram.org/bot${getRequiredEnv('TELEGRAM_BOT_TOKEN')}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: getRequiredEnv('TELEGRAM_CHAT_ID'),
        text: buildTelegramMessage(application, clientSubmittedAt),
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Telegram sendMessage failed: ${response.status} ${await response.text()}`,
    )
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'POST만 지원합니다.' })
  }

  let docRef

  try {
    const application = normalizeApplication(parseBody(req))
    const clientSubmittedAt = new Date().toISOString()
    const db = getDb()

    docRef = await db.collection('consultationApplications').add({
      ...application,
      status: 'new',
      paid: false,
      source: 'cashcard-web',
      telegramNotified: false,
      clientSubmittedAt,
      createdAt: FieldValue.serverTimestamp(),
    })

    await sendTelegram(application, clientSubmittedAt)

    await docRef.update({
      telegramNotified: true,
      telegramNotifiedAt: FieldValue.serverTimestamp(),
    })

    return res.status(201).json({ ok: true, id: docRef.id })
  } catch (error) {
    console.error(error)

    if (docRef) {
      await docRef.update({
        telegramNotified: false,
        telegramError: error.message.slice(0, 500),
      })
    }

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || '상담신청 처리에 실패했습니다.',
    })
  }
}
