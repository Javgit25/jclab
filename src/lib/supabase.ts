import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhicnrmjojshxgoxiekx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoaWNucm1qb2pzaHhnb3hpZWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODg5NjgsImV4cCI6MjA5MTI2NDk2OH0.tdQleqtNBHi1wqkoJpanbe4_lQtie1rKpsIrGnedH9E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
