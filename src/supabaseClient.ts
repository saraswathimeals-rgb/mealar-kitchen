import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rwyijcdeqndytxfjlzuc.supabase.co' // Replace with your Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eWlqY2RlcW5keXR4ZmpsenVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDY2NTUsImV4cCI6MjA4ODYyMjY1NX0.UVxS8-8Hzn6pk5Pvckp4TK2YwRYb_xJsWFHF0Za9zwA' // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseKey)