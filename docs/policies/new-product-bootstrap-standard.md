# 신규 제품 부트스트랩 표준

> GIT 회사에서 새 제품을 시작할 때 따르는 표준 절차

## 원칙

1. **Paperclip은 제어면(Control Plane)** — 프로젝트/이슈/에이전트 관리만 담당
2. **제품은 외부 런타임** — 자체 compose, DB, Redis, 포트, 볼륨을 갖는다
3. **DB/포트/볼륨은 절대 공유 금지**

## 부트스트랩 절차

### Step 1: Paperclip에 프로젝트 등록

- 프로젝트 이름, 설명, 기술 스택 정의
- Goals 생성 (3-5개)
- 초기 Issues 생성 (10-20개)
- Agent 배정

### Step 2: GitHub 레포 생성

```bash
gh repo create {company}/{product-name} --private --clone
cd {product-name}
```

### Step 3: 환경 격리 설정

```yaml
# docker-compose.yml (제품 전용)
services:
  db:
    image: postgres:16-alpine
    container_name: {product}-db
    ports:
      - "{고유포트}:5432"      # Paperclip 5432와 다른 포트
    volumes:
      - {product}-pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: {product}-redis
    ports:
      - "{고유포트}:6379"      # 기존과 다른 포트

  web:
    container_name: {product}-web
    ports:
      - "{고유포트}:3000"      # Paperclip 3100과 다른 포트

volumes:
  {product}-pgdata:
```

### Step 4: CLAUDE.md 작성

- 프로젝트 개요, 기술 스택
- Runtime Isolation 섹션 필수 포함
- Dangerous Commands 섹션 필수 포함

### Step 5: 격리 체크리스트 실행

`docs/policies/product-env-isolation-checklist.md` 참조

### Step 6: 초기 이슈 배정 및 개발 시작

- Pilot issue 2-3개 선정
- Agent에 배정
- PM(Claude)이 결과 리뷰

## 포트 할당 레지스트리

| 제품 | DB 포트 | Redis 포트 | Web 포트 |
|------|---------|-----------|---------|
| Paperclip | 5432 | — | 3100 |
| SOKDAK | 5433 | 6380 | 3000 |
| (다음 제품) | 5434 | 6381 | 3001 |

## 금지 사항

- Paperclip DB를 제품 DB로 사용하는 것
- Paperclip compose에 제품 서비스를 추가하는 것
- 제품 간 DB/Redis 공유
