import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 개발 환경에서는 환경 변수가 없어도 더미 클라이언트 생성 (실제 호출 시 에러 처리)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // 더미 클라이언트 (실제 호출 시 에러 발생)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Supabase environment variables are not configured.\n' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }
}

export { supabase };
