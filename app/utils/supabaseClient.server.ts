import { createClient } from '@supabase/supabase-js'
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

export const supabaseServerClient = createClient(supabaseUrl, supabaseSecretKey)