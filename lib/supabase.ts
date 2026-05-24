import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fvceqniysljjuckbahfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2Vxbml5c2xqanVja2JhaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA5MzEsImV4cCI6MjA5NDkyNjkzMX0.b2rzTJ59yPp2lqVUoaJ3JUseaaofzfe1_FKpBRNmFUI'
)