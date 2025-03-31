import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgdiutinwwdvclwrerar.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZGl1dGlud3dkdmNsd3JlcmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzODgxNDYsImV4cCI6MjA1ODk2NDE0Nn0.0_wnxiNgJ9yo2GAHOS7vYvb_m4Od9mkxKoHPUYv2Kg8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});