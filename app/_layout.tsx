import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('Navigation state:', { session, inAuthGroup, segments });

    if (session?.user) {
      // Se está logado e na área de auth, vai para conversas
      if (inAuthGroup) {
        console.log('Usuário logado, redirecionando para conversas');
        router.replace('/(chat)/conversations');
      }
    } else {
      // Se não está logado e fora da área de auth, vai para login
      if (!inAuthGroup) {
        console.log('Usuário não logado, redirecionando para login');
        router.replace('/(auth)/login');
      }
    }
  }, [session, loading, segments]);

  // Mostra loading enquanto verifica a sessão
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
