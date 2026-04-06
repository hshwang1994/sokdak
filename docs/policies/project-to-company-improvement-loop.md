# 프로젝트 → 회사 개선 루프

> 프로젝트 경험에서 발견한 개선사항을 회사 전체에 반영하는 절차

## 개선 루프 흐름

```
프로젝트 개발 중 문제 발견
  ↓
Retrospective 이슈 생성 (Paperclip)
  ↓
영향 범위 분석 (단일 프로젝트 vs 회사 전체)
  ↓
┌── 단일 프로젝트 → 프로젝트 docs 업데이트
└── 회사 전체 → 회사 정책/스킬/Instructions 업데이트
  ↓
변경 사항 전파 (에이전트 Instructions 업데이트)
  ↓
다음 프로젝트에서 검증
```

## 트리거 조건

| 이벤트 | 조치 |
|--------|------|
| 사고 발생 (INC) | 사고 보고서 + 정책 문서 + Instructions 업데이트 |
| 같은 실수 2회 반복 | Routine에 체크 항목 추가 |
| Agent가 동일 질문 3회 | Skill 생성 또는 Instructions 보강 |
| 신규 도구/패턴 발견 | 평가 후 회사 표준에 반영 |
| 프로젝트 완료 | Retrospective 실시, 교훈 문서화 |

## 반영 대상

### 1. Agent Instructions (AGENTS.md)

- 새로운 금지사항 추가
- 작업 원칙 보강
- 에스컬레이션 규칙 변경

### 2. Skills (Company Skills)

- 새로운 기술 패턴 스킬 추가
- 기존 스킬 업데이트 (버전 변경, 패턴 변경)
- 사용하지 않는 스킬 비활성화

### 3. Routines

- 주기적 검토 항목 추가/변경
- 체크리스트 보강

### 4. 정책 문서

- `docs/policies/` 하위 문서 생성/수정
- CLAUDE.md 업데이트

## 예시: INC-20260406 사고 → 회사 개선

```
[사고] Paperclip DB에 SOKDAK migration 실행
  ↓
[사고 보고서] docs/incidents/INC-20260406-paperclip-db-overwrite.md
  ↓
[정책 생성] docs/policies/product-runtime-isolation.md
  ↓
[CLAUDE.md 업데이트] Runtime Isolation 섹션 추가
  ↓
[Instructions 업데이트] CTO, Backend Lead, DevOps Lead에 금지사항 추가
  ↓
[Skill 생성] runtime-isolation 스킬 고려
  ↓
[다음 프로젝트에서 검증] 새 제품 부트스트랩 시 격리 체크리스트 적용
```

## 책임

| 역할 | 책임 |
|------|------|
| CTO | 기술 정책 최종 승인 |
| Chief of Staff | 전파 및 적용 확인 |
| QA Lead | 검증 기준 업데이트 |
| PM (Claude) | 전체 프로세스 조율 |
