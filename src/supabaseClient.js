import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ieiocioccehoshfldvhq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaW9jaW9jY2Vob3NoZmxkdmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTc5NzAsImV4cCI6MjA2NTU5Mzk3MH0.3CVqnDECtg5k8CoLOUKgJHpvVeOxspBzm-xLJTegyAM'

export const supabase = createClient(supabaseUrl, supabaseKey)