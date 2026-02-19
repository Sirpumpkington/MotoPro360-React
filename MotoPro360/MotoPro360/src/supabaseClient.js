import { createClient } from '@supabase/supabase-js'

// Estos datos los sacas de: Settings -> API en tu panel de Supabase
const supabaseUrl = 'https://mdkzmkdcsgzmyrpqpsws.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ka3pta2Rjc2d6bXlycHFwc3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzUxNTMsImV4cCI6MjA4NTc1MTE1M30.VkG72W29VMUS295AE62tBdbEzZZSD-lUG2WOVk4r7sI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)