# Task Manager

개인용 단일 사용자 할일 관리 웹앱

## 기능

- ✅ 내부 할일(Task) CRUD
- 📊 Dashboard (오늘/지연/중요/완료율) 집계
- 📥 Inbox에서 자연어 입력 → AI로 Task 구조화 → Preview → Apply로 DB 저장
- 🔍 Web search tool: 검색→요약→체크리스트/노트 저장
- 🔗 Microsoft Planner 연동: Read-only 미러링 + 수동 Sync

## 기술 스택

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL)
- Vercel AI SDK (Google Gemini 2.5)
- date-fns

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 `.env.example`을 참고하여 설정하세요.

```bash
cp .env.example .env.local
```

필수 환경 변수:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI API 키

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_init.sql` 실행
3. 프로젝트 설정에서 URL과 Service Role Key 복사

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## Microsoft Planner 연동

### 1. Azure App 등록

1. [Azure Portal](https://portal.azure.com) 접속
2. Azure Active Directory > App registrations > New registration
3. 이름 입력, Redirect URI 설정:
   - Type: Web
   - URI: `http://localhost:3000/api/integrations/planner/callback`
4. API permissions 추가:
   - Microsoft Graph > Delegated permissions
   - `Tasks.Read` 또는 `Group.Read.All` (테넌트 설정에 따라 다를 수 있음)
5. Client ID와 Client Secret 생성 및 복사

### 2. 환경 변수 설정

`.env.local`에 추가:
```
MS_CLIENT_ID=your_client_id
MS_CLIENT_SECRET=your_client_secret
MS_REDIRECT_URI=http://localhost:3000/api/integrations/planner/callback
MS_TENANT=common  # 또는 특정 테넌트 ID
```

## 프로젝트 구조

```
app/
  (app)/              # App Shell 레이아웃
    dashboard/        # 대시보드 페이지
    inbox/           # 인박스 페이지
    tasks/           # 할일 목록 페이지
    integrations/    # 연동 페이지
  api/               # API 라우트
    tasks/           # 할일 CRUD
    dashboard/       # 대시보드 데이터
    ai/              # AI 파싱/적용
    search/          # 웹 검색
    integrations/    # Planner 연동

lib/
  db/                # DB 레포지토리 레이어
  supabase/          # Supabase 클라이언트
  msgraph/           # Microsoft Graph 클라이언트
  ai/                # AI 스키마/프롬프트
  apiClient.ts       # 클라이언트 API 유틸

components/          # UI 컴포넌트
supabase/
  migrations/        # DB 마이그레이션
```

## API 엔드포인트

### Tasks
- `GET /api/tasks` - 할일 목록 조회
- `POST /api/tasks` - 할일 생성
- `PATCH /api/tasks/[id]` - 할일 수정
- `DELETE /api/tasks/[id]` - 할일 삭제

### Dashboard
- `GET /api/dashboard` - 대시보드 메트릭 및 오늘 할일

### AI
- `POST /api/ai/parse` - 자연어 → 구조화된 Task Preview
- `POST /api/ai/apply` - Preview → DB 저장

### Search
- `POST /api/search` - 웹 검색 (현재 mock)

### Integrations
- `GET /api/integrations/planner/connect` - Planner OAuth 시작
- `GET /api/integrations/planner/callback` - OAuth 콜백
- `POST /api/integrations/planner/sync` - Planner 동기화

## 데이터베이스 스키마

### tasks
- 내부 할일 및 Planner에서 가져온 할일 저장

### external_items
- Planner 원본 데이터 미러링 (read-only)

### ai_runs
- AI 파싱 이력 기록

### settings
- Planner 연결 상태 및 토큰 저장

## 개발 규칙

- TypeScript strict mode
- 모든 외부 응답은 zod로 검증
- DB 접근은 `/lib/db/*` 레포지토리 레이어 사용
- 클라이언트에서 Supabase 직접 호출 금지 (Route Handlers만 사용)
- 에러 처리: `{error: {message}}` 형태 통일

## 라이선스

MIT
