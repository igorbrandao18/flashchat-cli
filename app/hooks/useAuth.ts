import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { Session } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!session?.user?.id) return;

    try {
      // Primeiro verifica se o usuário existe na auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser?.user) {
        console.error('Usuário não encontrado na auth:', authError);
        setSession(null);
        return;
      }

      // Depois verifica se o perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        // Se o perfil não existe, cria ele primeiro
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.email?.split('@')[0] || 'User',
            avatar_url: null,
          });

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          // Se o erro for de chave estrangeira, significa que o usuário não existe mais
          if (insertError.code === '23503') {
            setSession(null);
          }
          return;
        }
      }

      // Agora que temos certeza que o perfil existe, atualiza o status
      const { error } = await supabase.rpc('update_user_status', {
        user_id: session.user.id,
        is_online: isOnline,
      });

      if (error) {
        console.error('Erro ao atualizar status online:', error);
        // Se falhou em atualizar o status, tenta inserir diretamente
        await supabase
          .from('user_status')
          .upsert({
            id: session.user.id,
            status: isOnline ? 'online' : 'offline',
            online_at: isOnline ? new Date().toISOString() : null,
            last_seen_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let heartbeatInterval: NodeJS.Timeout;

    // Busca a sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Verifica se o usuário ainda existe
      if (session?.user?.id) {
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser?.user) {
          console.log('Sessão inválida, usuário não existe');
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }
      }

      if (mounted) {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          updateOnlineStatus(true);
          // Inicia o heartbeat para manter o status online
          heartbeatInterval = setInterval(() => {
            updateOnlineStatus(true);
          }, 30000); // A cada 30 segundos
        }
      }
    });

    // Configura o listener para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        // Verifica se o usuário ainda existe
        if (session?.user?.id) {
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          if (authError || !authUser?.user) {
            console.log('Sessão inválida, usuário não existe');
            setSession(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setLoading(false);
        if (session?.user) {
          updateOnlineStatus(true);
          // Reinicia o heartbeat
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            updateOnlineStatus(true);
          }, 30000);
        } else {
          // Se não tem sessão, limpa o heartbeat
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }
    });

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateOnlineStatus(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateOnlineStatus(false);
      }
    };

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      appStateSubscription.remove();
      if (session?.user) {
        updateOnlineStatus(false);
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Iniciando cadastro...', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Erro no cadastro:', error);
        throw error;
      }

      console.log('Cadastro bem sucedido:', data.session?.user?.id);

      // Se o signup foi bem sucedido e temos uma sessão, cria o perfil
      if (data.session?.user) {
        console.log('Criando perfil para o novo usuário...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.session.user.id,
            full_name: email.split('@')[0],
            avatar_url: null,
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Se o erro não for de duplicidade, propaga o erro
          if (profileError.code !== '23505') {
            throw profileError;
          }
        } else {
          console.log('Perfil criado com sucesso');
          // Só atualiza o status se o perfil foi criado com sucesso
          console.log('Atualizando status para online...');
          await updateOnlineStatus(true);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no signup:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Iniciando login...', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      console.log('Login bem sucedido:', data.session?.user?.id);

      // Se temos uma sessão, garante que o perfil existe
      if (data.session?.user) {
        console.log('Verificando perfil do usuário...');
        
        // Verifica se o perfil existe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileError || !profile) {
          console.log('Perfil não encontrado, criando...');
          // Se não existe, cria o perfil
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.session.user.id,
              full_name: email.split('@')[0],
              avatar_url: null,
            });

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            // Se o erro não for de duplicidade, propaga o erro
            if (insertError.code !== '23505') {
              throw insertError;
            }
          } else {
            console.log('Perfil criado com sucesso');
          }
        } else {
          console.log('Perfil encontrado:', profile);
        }

        // Atualiza o status online
        console.log('Atualizando status para online...');
        await updateOnlineStatus(true);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no signin:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Marca como offline antes de fazer logout
      await updateOnlineStatus(false);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      console.error('Erro no signout:', error);
      return { error };
    }
  };

  return {
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

export default useAuth;