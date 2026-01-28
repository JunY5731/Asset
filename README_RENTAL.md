# 자산/소모품 대여 관리 시스템

얼굴 인식 + QR 스캔 기반 자동 기록 시스템 (Next.js + Supabase)

## 기능

- **얼굴 인식 자동입력**: face-api.js로 대여자 이름/팀 자동 입력
- **QR 스캔 품목 기록**: 선반 카메라로 QR 전후 비교하여 정확한 품목명 자동 기록
- **카메라 선택**: 얼굴/선반 카메라를 각각 선택하고 localStorage에 저장
- **Supabase 연동**: 대여 로그를 PostgreSQL에 저장

## 환경 설정

### 1. 환경 변수

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. 프로젝트 설정에서 URL과 Anon Key 복사

### 3. face-api.js 모델 파일

`public/models/` 폴더에 다음 모델 파일이 필요합니다:

- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `ssd_mobilenetv1_model-shard2`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

모델 파일은 [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)에서 다운로드할 수 있습니다.

### 4. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## 사용 방법

### 1. 카메라 설정

- **얼굴 카메라**: 노트북 내장 카메라 또는 첫 번째 웹캠
- **선반 카메라**: Logitech C920 또는 두 번째 웹캠
- 선택한 카메라는 localStorage에 저장되어 다음 접속 시 자동 복원됩니다.

### 2. 얼굴 등록

1. "얼굴 등록" 섹션에서 직원 선택
2. "현재 얼굴 등록" 버튼 클릭
3. 한 사람당 2~3회 다양한 각도로 등록 (인식률 향상)

### 3. 대여 프로세스

1. **얼굴 인식 자동입력**:
   - "얼굴로 자동 입력" 체크박스 활성화
   - 얼굴이 인식되면 자동으로 이름/팀 입력
   - 실패 시 수동으로 직원 선택 가능

2. **품목 자동 기록**:
   - "기준 상태 저장(BEFORE)" 버튼 클릭 → 2초간 QR 스캔
   - 품목을 선반에서 가져가기
   - "대여 확정(After 비교)" 버튼 클릭 → 1.5초 대기 후 2초간 QR 스캔
   - 감지된 반출 품목을 체크박스로 확인/수정
   - "대여 확정" 버튼 클릭하여 저장

### 4. 대여 기록 확인

오른쪽 패널에서 최근 20건의 대여 내역을 확인할 수 있습니다.

## 테스트 시나리오

1. **노트북에서 카메라 선택**:
   - Face Camera = 내장 카메라
   - Shelf Camera = C920

2. **얼굴 등록**:
   - 총무팀 허준영 사원 등록 (2~3회)
   - 총무팀 정대호 사원 등록 (2~3회)
   - 총무팀 이준영 차장 등록 (2~3회)

3. **대여 모달에서 얼굴 자동입력 확인**:
   - "얼굴로 자동 입력" 활성화
   - 허준영 사원 얼굴 인식 확인

4. **QR BEFORE 스캔**:
   - 선반에 5개 QR 모두 표시
   - "기준 상태 저장(BEFORE)" 클릭
   - 5개 모두 인식 확인

5. **품목 가져가기 및 AFTER 비교**:
   - 물티슈(ITEM_02) 1개 가져가기
   - "대여 확정(After 비교)" 클릭
   - itemsTaken에 "물티슈" 확인

6. **대여 확정 및 이력 확인**:
   - "대여 확정" 버튼 클릭
   - 최근 기록에 대여자(허준영) + 품목(물티슈) 기록 확인

## 주의사항

- **로컬 서버 필수**: `file://` 프로토콜로는 카메라 접근이 불가능합니다. 반드시 로컬 서버(`npm run dev`, `npx serve`, `python -m http.server` 등)에서 실행하세요.
- **카메라 권한**: 브라우저에서 카메라 권한을 허용해야 합니다.
- **조명**: QR 스캔 시 충분한 조명이 필요합니다.
- **RLS 비활성화**: MVP에서는 RLS가 비활성화되어 있습니다. 운영 환경에서는 인증/RLS를 활성화하는 것을 권장합니다.

## 문제 해결

### 카메라가 안 나옴
- 브라우저 권한 확인
- 로컬 서버에서 실행 중인지 확인
- 카메라가 다른 프로그램에서 사용 중이 아닌지 확인

### 얼굴 인식이 안 됨
- 모델 파일이 `public/models/`에 있는지 확인
- 얼굴이 화면 중앙에 위치하는지 확인
- 조명이 충분한지 확인
- 2~3회 등록했는지 확인

### QR 스캔이 안 됨
- 카메라 각도/초점 확인
- 조명 확인
- QR 코드가 선명하게 보이는지 확인
- 선반 카메라와 얼굴 카메라가 다른 장치인지 확인

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, React 19
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: face-api.js (얼굴 인식), jsQR (QR 스캔)
- **UI**: Tailwind CSS, shadcn/ui
