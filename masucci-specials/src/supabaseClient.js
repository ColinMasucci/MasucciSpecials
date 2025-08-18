import { createClient } from '@supabase/supabase-js';

//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = "https://xeocwihxchdmfjruhxmf.supabase.co"
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlb2N3aWh4Y2hkbWZqcnVoeG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODM0NzYsImV4cCI6MjA3MTA1OTQ3Nn0.NvfGd80lANj7tAyifWWi0qsGfXfzsoKz7VvJW7xkV6A
//const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);