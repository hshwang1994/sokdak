# INC-20260406: Paperclip DB Overwrite Incident

## Severity: Critical

## Summary

SOKDAK 프로젝트의 Prisma migration이 Paperclip control plane DB에 실행되어
Paperclip의 전체 운영 데이터가 유실됨.

## Timeline (KST)

| 시각 | 사건 |
|------|------|
| 2026-04-06 00:04 | Phase 2 이슈 3개(GOO-149/158/159) todo 전환 및 에이전트 wakeup |
| 2026-04-06 00:04 | Frontend Lead, UI/UX Designer, Backend Engineer 트리거 |
| 2026-04-06 00:06 | 에이전트가 SOKDAK workspace에서 npm install + prisma db push 실행 |
| 2026-04-06 00:06 | SOKDAK workspace에 .env 없음 -> 컨테이너 전역 DATABASE_URL 사용 |
| 2026-04-06 00:06 | Paperclip DB(public schema) 64개 테이블 DROP, SOKDAK 7개 테이블 CREATE |
| 2026-04-06 00:07 | Paperclip API 500 에러 발생 |
| 2026-04-06 00:10 | 사고 인지 (DB 테이블 조회 시 SOKDAK 테이블만 존재) |
| 2026-04-06 00:15 | SOKDAK 테이블 DROP + Drizzle migration 47개 재실행 -> 스키마 복구 |
| 2026-04-06 00:15 | 데이터 전량 유실 확인 (회사/에이전트/이슈/코멘트/루틴 등) |

## Root Cause

### 직접 원인

에이전트가 Paperclip 컨테이너 내부의 SOKDAK workspace에서 Prisma CLI를 실행.
workspace에 `.env` 파일이 없어서 컨테이너 전역 환경변수
`DATABASE_URL=postgres://paperclip:paperclip@db:5432/paperclip`이 사용됨.
Prisma가 이 URL을 대상으로 SOKDAK 스키마를 적용하여 Paperclip 테이블을 파괴.

### 인과 체인

```
에이전트 wakeup
  -> Paperclip이 SOKDAK repo를 컨테이너 내부 workspace에 clone
  -> 에이전트가 workspace 안에서 npm install 실행
  -> 에이전트가 prisma generate + prisma db push 실행
  -> workspace에 .env 없음
  -> process.env.DATABASE_URL = Paperclip 전역 값 (paperclip DB)
  -> Prisma가 Paperclip DB의 public 스키마를 SOKDAK 스키마로 교체
  -> Paperclip 64개 테이블 DROP -> SOKDAK 7개 테이블 CREATE
  -> Paperclip 전체 운영 데이터 소멸
```

### 근본 원인 5가지

1. **런타임 경계 미분리**: 제품 코드가 Paperclip 컨테이너 안에서 실행됨
2. **환경변수 격리 없음**: 컨테이너 전역 DATABASE_URL이 모든 workspace에 노출
3. **제품 .env 미생성**: SOKDAK workspace에 별도 .env가 없어서 fallback 발생
4. **Dangerous command 통제 없음**: prisma db push 같은 파괴적 명령에 승인 절차 없음
5. **에이전트 실행 범위 무제한**: DB migration을 포함한 모든 인프라 변경을 자율 실행 가능

## Impact

### 유실된 데이터

| 항목 | 수량 | 복구 가능 여부 |
|------|------|--------------|
| GIT 회사 | 1 | O (재생성) |
| 에이전트 | 15 | O (재생성) |
| 프로젝트 (Onboarding, SOKDAK) | 2 | O (재생성) |
| 목표 (Goals) | 20+ | O (재생성) |
| 이슈 (Issues) | 183 | 부분 (구조 재생성 가능, 코멘트 유실) |
| 코멘트 (Comments) | 수백 | X (영구 유실) |
| 루틴 (Routines) | 6+ | O (재생성) |
| Heartbeat 기록 | 수십 | X (영구 유실) |
| Wakeup 요청 기록 | 수십 | X (영구 유실) |
| 에이전트 작업 기록 | 전체 | X (영구 유실) |

### 무사한 항목

| 항목 | 상태 |
|------|------|
| Paperclip DB 스키마 | 복구 완료 (Drizzle migration 재실행) |
| Paperclip 서버 | 정상 (health: ok, bootstrap_pending) |
| SOKDAK GitHub repo | 무사 (2 commits) |
| SOKDAK 로컬 코드 | 무사 (C:\projects\sokdak) |
| 재생성 스크립트 | 무사 (C:\tmp\gen_sokdak_project.py) |

## Recovery Actions

1. SOKDAK 테이블 DROP (public schema 정리)
2. Drizzle migration tracking 리셋 (47개 레코드 DELETE)
3. Drizzle migration 47개 재실행 -> Paperclip 스키마 복구
4. 데이터 재생성 (회사/에이전트/프로젝트/이슈/루틴)

## Prevention Rules

1. Product Runtime Isolation: 모든 제품은 Paperclip 밖 별도 runtime에서 실행
2. DB Migration Safety: Paperclip DB에 제품 migration 절대 금지
3. Workspace .env 필수: 모든 workspace에 .env 필수, 없으면 ORM CLI 실행 금지
4. Dangerous Command Approval: prisma db push/migrate reset 등 CTO 승인 필요
5. Separate Compose Standard: 제품별 별도 compose/DB/port/volume 분리

## Remaining Risks

- Paperclip 에이전트 실행 시 여전히 컨테이너 전역 DATABASE_URL 노출
- 향후 다른 제품 프로젝트에서 동일 패턴 재발 가능
- 에이전트의 destructive command 실행을 시스템 수준에서 차단하는 기능이 Paperclip에 없음

## Lessons Learned

- "Paperclip에 프로젝트를 만든다"와 "제품을 Paperclip 안에서 실행한다"는 완전히 다른 개념
- workspace path와 runtime path는 반드시 구분해야 함
- .env fallback은 silent failure를 유발하는 가장 위험한 패턴 중 하나
- 에이전트에게 DB migration 권한을 주면 안 됨
