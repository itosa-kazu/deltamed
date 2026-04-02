import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://liiiaegezuyejfifdhad.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaWlhZWdlenV5ZWpmaWZkaGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY0OTcsImV4cCI6MjA5MDcwMjQ5N30.oRoLUK794CrYD1DgsNN45ktMBeG15JqKuYRk74dcX9Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
