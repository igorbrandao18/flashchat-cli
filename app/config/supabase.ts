import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzzsnhhkiwovcssdakqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6enNuaGhraXdvdmNzc2Rha3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcxOTAsImV4cCI6MjA1OTA5MzE5MH0.FO1JU83z8XAeUJBk87KmOgDruN3g6GKK9YnpfvSmZfY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});