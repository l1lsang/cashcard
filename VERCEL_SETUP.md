# Vercel API Setup

이 프로젝트는 상담신청을 `/api/consultations` Vercel API로 전송합니다. API는 Firebase Admin SDK로 Firestore에 저장하고, Telegram Bot API로 신규 신청 내용을 보냅니다.

## Vercel Environment Variables

Vercel 프로젝트 설정의 Environment Variables에 아래 값을 추가하세요.

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

`FIREBASE_PRIVATE_KEY`는 Firebase 서비스 계정 JSON의 `private_key` 값입니다. Vercel에 넣을 때 줄바꿈이 깨지면 `\n` 형태로 넣어도 API에서 실제 줄바꿈으로 변환합니다.

## Firestore

저장 컬렉션은 `consultationApplications`입니다. 브라우저에서 직접 Firestore에 접근하지 않기 때문에 `firestore.rules`는 전체 클라이언트 읽기/쓰기를 막아둔 상태입니다.

## Local API Test

Vite dev server만 실행하면 `/api`가 뜨지 않습니다. API까지 로컬에서 확인하려면 Vercel CLI로 실행하세요.

```bash
vercel dev
```
