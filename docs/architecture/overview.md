# SOKDAK 아키텍처 개요

## 시스템 구성

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (브라우저)                       │
│                    localhost:3000                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  SOKDAK Runtime                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js 15 (App Router)              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Pages   │  │ API Route│  │ Server Action│    │   │
│  │  │  (SSR)   │  │ /api/*   │  │ (mutation)   │    │   │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │   │
│  │       └──────────────┼───────────────┘           │   │
│  │                      │                           │   │
│  │               ┌──────┴──────┐                    │   │
│  │               │   Prisma    │                    │   │
│  │               │   Client    │                    │   │
│  │               └──────┬──────┘                    │   │
│  └──────────────────────┼──────────────────────────┘   │
│                         │                               │
│        ┌────────────────┼────────────────┐              │
│   ┌────┴─────┐    ┌─────┴────┐    ┌─────┴─────┐       │
│   │PostgreSQL│    │  Redis   │    │  Worker   │        │
│   │  :5433   │    │  :6380   │    │  (cron)   │        │
│   │  sokdak  │    │          │    │           │        │
│   └──────────┘    └──────────┘    └───────────┘        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Paperclip Control Plane                    │
│               localhost:3100 (별도 런타임)                │
│               → 프로젝트/이슈/에이전트 관리만              │
└─────────────────────────────────────────────────────────┘
```

## 데이터 흐름

### 읽기 (Read)

```
브라우저 → Next.js Page (SSR) → Prisma → PostgreSQL
                                       → Redis (캐시 hit 시)
```

### 쓰기 (Write)

```
브라우저 → API Route / Server Action → Zod 검증 → Prisma → PostgreSQL
                                                         → Redis 캐시 무효화
```

### 실시간 (향후)

```
브라우저 → WebSocket / SSE → Next.js → Redis Pub/Sub
```

## 핵심 모듈

| 모듈 | 경로 | 책임 |
|------|------|------|
| Auth | `src/lib/auth/` | 인증/인가 (이메일 OTP + Argon2id) |
| Board | `src/app/(main)/boards/` | 게시판 CRUD |
| Post | `src/app/(main)/posts/` | 게시글 CRUD + 검색 |
| Comment | `src/app/api/comments/` | 댓글/대댓글 |
| Reaction | `src/app/api/reactions/` | 이모지 리액션 |
| LunchVote | `src/app/(main)/lunch-vote/` | 점심 투표 |
| WorryBox | `src/app/(main)/worry-box/` | 고민 상자 |
| Emotion | `src/app/(main)/emotion/` | 감정 공유 |
| BalanceGame | `src/app/(main)/balance-game/` | 밸런스 게임 |
| Admin | `src/app/(main)/admin/` | 관리자 대시보드 |

## 보안 아키텍처

### 인증 (Auth) — ADR-001 참조

```
가입: 이메일 OTP 확인 → 닉네임/비밀번호 설정 → 계정 생성
로그인: login_id + password → Argon2id 검증 → 세션 발급
```

- 이메일은 가입 검증용으로만 사용, DB에 해시 저장, UI 노출 없음
- 비밀번호: Argon2id (memory=64MB, time=3, parallelism=4)
- 세션: httpOnly 쿠키, 최대 동시 3개

### 익명성 보장

- display_nickname만 공개
- login_id는 로그인 전용, 절대 노출 안 됨
- 이메일은 가입 검증 후 해시만 저장
- IP 로깅: admin 전용 감사 로그에만 기록

## 성능 전략

| 계층 | 전략 |
|------|------|
| SSR | 정적 페이지는 ISR, 동적은 SSR |
| DB | 인덱스 최적화, 풀텍스트 검색 (tsvector) |
| 캐시 | Redis: 인기글, 투표 결과, 세션 |
| CDN | 정적 자산 (이미지, 폰트) |
| 번들 | Next.js 자동 코드 스플리팅 |
