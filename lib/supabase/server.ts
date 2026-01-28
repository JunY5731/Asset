import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 전용 Supabase 클라이언트
// NOTE: 빌드/개발 시 환경변수가 없더라도 모듈 평가 단계에서 throw하지 않도록 처리
// (실제 운영에서는 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 설정 권장)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  // placeholder (실제 호출 시 실패 가능)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { supabase };
