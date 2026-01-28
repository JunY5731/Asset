-- 자산/소모품 대여 시스템 스키마
-- RLS는 MVP에서 비활성화 (운영 시에는 인증/RLS 권장)

-- 직원 테이블
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 품목 테이블
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,  -- ITEM_01, ITEM_02, ...
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 대여 로그 테이블
CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  items_taken TEXT[] NOT NULL,  -- ["ITEM_03", "ITEM_05"] 같은 ID 배열
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_rentals_employee_id ON rentals(employee_id);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON rentals(created_at DESC);

-- RLS 비활성화 (MVP)
-- 운영 시에는 인증/RLS 권장
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE rentals DISABLE ROW LEVEL SECURITY;

-- 시드 데이터
-- 직원 3명
INSERT INTO employees (name, team, title) VALUES
  ('허준영', '총무팀', '사원'),
  ('정대호', '총무팀', '사원'),
  ('이준영', '총무팀', '차장')
ON CONFLICT DO NOTHING;

-- 품목 5개
INSERT INTO items (id, name) VALUES
  ('ITEM_01', '각티슈'),
  ('ITEM_02', '물티슈'),
  ('ITEM_03', '볼펜'),
  ('ITEM_04', '풀'),
  ('ITEM_05', '네임펜')
ON CONFLICT (id) DO NOTHING;
