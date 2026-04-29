export type ConsultationApplicationInput = {
  name: string
  phone: string
  requestedDate: string
  requestedTime: string
  amount: string
  cardType: string
  message: string
}

export async function saveConsultationApplication(
  application: ConsultationApplicationInput,
) {
  const response = await fetch('/api/consultations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(application),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || '상담신청 전송에 실패했습니다.')
  }

  return response.json()
}
