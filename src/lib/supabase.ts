
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Use the values from the Supabase integration directly instead of environment variables
const supabaseUrl = "https://pkbsgndghdbbqfyaieyk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYnNnbmRnaGRiYnFmeWFpZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTUxODEsImV4cCI6MjA2MTI3MTE4MX0.ccTgSa2mwY_OlLJdImjmc0MeEoaU45K9KwCaPeyabVU";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'promptfighter-auth'
  }
});
