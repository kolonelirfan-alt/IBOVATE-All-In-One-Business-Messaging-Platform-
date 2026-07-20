import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsaxilxpdbzkvptyjtld.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYXhpbHhwZGJ6a3ZwdHlqdGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzA2NDcsImV4cCI6MjEwMDA0NjY0N30.ifIUiePHaVTh5R8mTyxrD73jKsCWDu0vQXNtQa5-ol8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
