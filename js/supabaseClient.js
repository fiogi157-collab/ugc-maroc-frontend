import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://arfmvtfkibjadxwnbqjl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZm12dGZraWJqYWR4d25icWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODI0MjAsImV4cCI6MjA3NTY1ODQyMH0.PIWR6lWml5iliG4658nZdaNy1aiF7hgZZUR__NUDOT0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
