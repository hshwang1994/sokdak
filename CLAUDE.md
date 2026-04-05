# SOKDAK — 사내 익명 커뮤니티 서비스

## 개요

사내 구성원을 위한 익명 커뮤니티 플랫폼. 자유로운 소통과 재미 기능을 통해 조직 문화를 활성화한다.

**핵심 가치**: 익명성 보장 + 재미 기능 = 솔직한 소통 문화

---

## 기술 스택

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| **Framework** | Next.js (App Router) | 15+ |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x / latest |
| **ORM** | Prisma | 6.x |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Auth** | Custom (Argon2id) | — |
| **Testing** | Vitest + Playwright | latest |
| **Container** | Docker Compose | 3.9 |

---

## 아키텍처

```
┌─────────────────────────────────────────┐
│              Next.js App                │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ App      │  │ API      │  │ Server │ │
│  │ Router   │  │ Routes   │  │ Actions│ │
│  │ (Pages)  │  │ (/api/*) │  │        │ │
│  └─────────┘  └──────────┘  └────────┘ │
│         │           │            │      │
│         └───────────┼────────────┘      │
│                     │                   │
│              ┌──────┴──────┐            │
│              │   Prisma    │            │
│              │   Client    │            │
│              └──────┬──────┘            │
└─────────────────────┼──────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
     ┌────┴────┐ ┌────┴────┐ ┌───┴────┐
     │PostgreSQL│ │  Redis  │ │ Worker │
     │   16    │ │    7    │ │ (cron) │
     └─────────┘ └─────────┘ └────────┘
```

---

## 인증 모델

- **login_id**: 4-20자 영숫자 (로그인 전용, 비공개)
- **display_nickname**: 2-12자 (게시판에 표시되는 닉네임)
- **password**: Argon2id 해싱 (memory=64MB, time=3, parallelism=4)
- **join_code**: 가입 시 필요한 초대 코드 (admin 발급)
- **recovery_key**: 가입 시 1회 표시, bcrypt 해싱 저장
- **session**: httpOnly 쿠키 + sessions 테이블, 최대 동시 3세션

### 역할 (5-Role RBAC)

| Role | 권한 |
|------|------|
| `user` | 글/댓글 CRUD, 투표, 감정 공유 |
| `moderator` | + 신고 처리, 글 숨김/삭제 |
| `admin` | + 게시판 관리, join_code 관리, 사용자 제재 |
| `super_admin` | + 역할 변경, 시스템 설정 |
| `audit_admin` | 읽기 전용 감사 로그 조회 (수정 불가) |

---

## 주요 기능

### 커뮤니티
- 게시판 (자유/질문/제안 등 카테고리)
- 게시글 CRUD (마크다운)
- 댓글/대댓글 (2-depth)
- 이모지 리액션 (좋아요, 공감, 웃겨요, 슬퍼요, 화나요)
- 신고/제재 시스템
- 인기글/트렌딩
- 전문 검색 (PostgreSQL tsvector)

### 재미 기능 (CORE)
- **점심 투표**: 매일 11:00-11:30 투표, 실시간 차트
- **고민 상자**: 익명 고민 + 익명 답변, 채택 기능
- **감정 공유**: 오늘의 감정 이모지, 팀 히트맵
- **밸런스 게임**: 양자택일 투표 + 토론

---

## 파일 구조

```
sokdak/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 라우트 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/             # 메인 라우트 그룹
│   │   │   ├── boards/
│   │   │   ├── posts/
│   │   │   ├── notifications/
│   │   │   ├── admin/
│   │   │   ├── lunch-vote/
│   │   │   ├── worry-box/
│   │   │   ├── emotion/
│   │   │   └── balance-game/
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   ├── community/          # 커뮤니티 컴포넌트
│   │   └── fun/                # 재미 기능 컴포넌트
│   ├── lib/                    # 유틸리티, DB 클라이언트
│   ├── types/                  # TypeScript 타입 정의
│   ├── hooks/                  # React 커스텀 훅
│   └── styles/                 # 글로벌 스타일
├── prisma/
│   └── schema.prisma           # Prisma 스키마 (24 모델)
├── public/                     # 정적 파일
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   └── ops/                    # 운영 문서
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/                     # Dockerfile, Dockerfile.worker
├── scripts/                    # 유틸리티 스크립트
├── .github/workflows/          # CI/CD
├── docker-compose.yml
├── .env.example
└── CLAUDE.md                   # 이 파일
```

---

## 개발 가이드

### 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env

# 3. Docker 서비스 기동 (DB + Redis)
docker compose up -d db redis

# 4. DB 마이그레이션
npx prisma migrate dev

# 5. 시드 데이터
npx prisma db seed

# 6. 개발 서버
npm run dev
```

### Docker 전체 기동

```bash
docker compose up -d
# http://localhost:3000 접속
```

### 테스트

```bash
npm run test          # 단위 테스트 (Vitest)
npm run test:e2e      # E2E 테스트 (Playwright)
npm run test:coverage # 커버리지 리포트
```

---

## 코딩 컨벤션

- **Immutability**: 객체 변경 금지, 새 객체 반환
- **파일 크기**: 200-400줄 권장, 800줄 이하
- **함수 크기**: 50줄 이하
- **에러 처리**: 모든 레벨에서 명시적 처리
- **입력 검증**: 시스템 경계에서 반드시 검증 (Zod)
- **테스트**: 80%+ 커버리지 목표

---

## Git 워크플로우

```
main
├── feature/{기능명}     # 새 기능
├── bugfix/{버그명}      # 버그 수정
└── docs/{문서명}        # 문서 업데이트
```

커밋 메시지: `<type>: <description>`
Types: feat, fix, refactor, docs, test, chore, perf, ci

---

## Paperclip 연동

이 프로젝트는 Paperclip AI 플랫폼(GOO 회사)의 SOKDAK 프로젝트로 관리된다.
- **Issues**: GOO-129 ~ GOO-173 (45개)
- **Goals**: G1(기반) ~ G5(운영)
- **Routines**: CEO/CTO/QA/Security/DevOps/CoS 주기적 리뷰
- **Agents**: 15명 전원 참여
