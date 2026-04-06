# 위험 명령어 승인 정책

> 적용 범위: GIT 회사 전체 (Paperclip 제어면 + 모든 제품 런타임)

## 승인 등급

### Level 1: CTO 승인 필수

아래 명령어는 실행 전 CTO 에이전트의 승인이 필요하다.

| 카테고리 | 명령어 | 사유 |
|----------|--------|------|
| DB 파괴 | `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` | 데이터 영구 손실 |
| Migration 리셋 | `prisma migrate reset`, `prisma db push --force-reset` | 스키마 전체 재생성 |
| 볼륨 삭제 | `docker compose down -v` | 영구 데이터 손실 |
| 프로덕션 배포 | `prisma migrate deploy` (prod) | 프로덕션 스키마 변경 |
| 비밀 변경 | Vault/Secret 수정, `.env` 프로덕션 변경 | 인증 체계 영향 |

### Level 2: Lead 승인 필수

| 카테고리 | 명령어 | 사유 |
|----------|--------|------|
| 컨테이너 조작 | `docker compose down`, `docker rm` | 서비스 중단 |
| Git 파괴 | `git push --force`, `git reset --hard` | 커밋 이력 손실 |
| 패키지 주요 업그레이드 | major version bump | 호환성 영향 |

### Level 3: 자율 실행 (로그 필수)

| 카테고리 | 명령어 |
|----------|--------|
| 코드 변경 | `git commit`, `git push` |
| 테스트 | `npm test`, `vitest`, `playwright` |
| 빌드 | `npm run build`, `docker build` |
| 개발 DB | `prisma migrate dev` (로컬 전용) |

## 승인 프로세스

1. 실행자가 Paperclip 이슈 코멘트에 명령어 + 사유 기록
2. 승인자가 코멘트로 승인 (또는 거부 + 대안 제시)
3. 실행 후 결과를 코멘트에 기록

## 사고 발생 시

1. **즉시 중단** — 추가 명령 실행 금지
2. **CTO + DevOps Lead에 에스컬레이션**
3. **사고 보고서** 작성 (`docs/incidents/INC-{날짜}-{제목}.md`)
4. **복구 절차** 실행 (백업에서 복원)
