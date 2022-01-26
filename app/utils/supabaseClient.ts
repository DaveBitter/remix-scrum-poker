import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nxjqxdleyhtoqghqhlre.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQyNzYyNzI3LCJleHAiOjE5NTgzMzg3Mjd9.jzTI6fHXxfmSSZkTd2U6QkVAB0bNdJk86YcCSSJfpB4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)