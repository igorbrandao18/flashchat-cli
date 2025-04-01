import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  SectionList,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface UserStatus {
  status: string;
  last_seen_at: string | null;
  device_id: string;
}

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_status: UserStatus[];
}

interface ProcessedUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_status: {
    status: string;
    last_seen_at: string | null;
    device_id: string | null;
  };
}

export default function ConversationsScreen() {
  const [users, setUsers] = useState<ProcessedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProcessedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { session, loading } = useAuth();
  const [usersLoading, setUsersLoading] = useState(true);
  const { colors } = useTheme();

  // Se não estiver logado, redireciona para o login
  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Função para buscar usuários
  const fetchUsers = async () => {
    if (!session?.user?.id) {
      console.log('Sem usuário logado');
      setUsersLoading(false);
      return;
    }

    try {
      console.log('Iniciando busca de usuários...');
      console.log('ID do usuário atual:', session.user.id);
      
      // Primeiro, vamos verificar se o perfil do usuário atual existe
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Erro ao verificar perfil atual:', profileError);
        // Se o perfil não existe, vamos criá-lo
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.email?.split('@')[0] || 'Usuário',
              avatar_url: null,
            });

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          } else {
            console.log('Perfil criado com sucesso');
          }
        }
      } else {
        console.log('Perfil atual encontrado:', currentProfile);
      }

      // Agora busca todos os outros usuários
      console.log('Buscando outros usuários...');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          user_status (
            status,
            last_seen_at,
            device_id
          )
        `);

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        setUsersLoading(false);
        return;
      }

      console.log('Todos os perfis encontrados:', profiles);
      
      // Filtra o usuário atual da lista
      const otherProfiles = profiles?.filter(profile => profile.id !== session.user.id) || [];
      console.log('Perfis após filtrar usuário atual:', otherProfiles);

      // Processa os usuários com seus status
      const usersWithStatus = otherProfiles.map((profile: User) => {
        // Verifica se o usuário está online em algum dispositivo
        const isOnlineOnAnyDevice = profile.user_status?.some(
          status => status.status === 'online'
        );

        // Pega o último status visto (mais recente)
        const lastSeenStatus = profile.user_status?.reduce((latest, current) => {
          if (!latest || (latest.last_seen_at && current.last_seen_at && 
              new Date(current.last_seen_at) > new Date(latest.last_seen_at))) {
            return current;
          }
          return latest;
        }, profile.user_status[0]);

        console.log('Processando perfil:', {
          id: profile.id,
          name: profile.full_name,
          online: isOnlineOnAnyDevice,
          devices: profile.user_status?.length || 0
        });
        
        const processedUser: ProcessedUser = {
          ...profile,
          full_name: profile.full_name || 'Usuário sem nome',
          user_status: {
            status: isOnlineOnAnyDevice ? 'online' : 'offline',
            last_seen_at: lastSeenStatus?.last_seen_at || null,
            device_id: lastSeenStatus?.device_id || null
          }
        };

        return processedUser;
      });

      console.log('Usuários processados:', usersWithStatus.map(u => ({
        id: u.id,
        name: u.full_name,
        status: u.user_status?.status,
        lastSeen: u.user_status?.last_seen_at
      })));
      
      // Ordena usuários: online primeiro, depois por nome
      const sortedUsers = usersWithStatus.sort((a, b) => {
        // Primeiro compara status online
        if (a.user_status?.status === 'online' && b.user_status?.status !== 'online') return -1;
        if (a.user_status?.status !== 'online' && b.user_status?.status === 'online') return 1;
        
        // Depois compara nomes, tratando valores null/undefined
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return nameA.localeCompare(nameB);
      });

      console.log('Lista final de usuários:', sortedUsers.map(u => ({
        id: u.id,
        name: u.full_name,
        status: u.user_status?.status
      })));

      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Erro em fetchUsers:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    // Busca inicial de usuários
    fetchUsers();

    if (!session?.user?.id) {
      return;
    }

    // Inscreve para mudanças em tempo real na tabela user_status
    const statusChannel = supabase.channel('user_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
        },
        (payload) => {
          console.log('Mudança de status recebida:', payload);
          
          if (payload.eventType === 'DELETE') {
            console.log('Status removido:', payload.old.id);
            // Quando um status é removido, consideramos o usuário como offline
            const updateUserList = (current: ProcessedUser[]) => {
              const updatedUsers = current.map(user => 
                user.id === payload.old.id
                  ? {
                      ...user,
                      user_status: {
                        status: 'offline',
                        last_seen_at: new Date().toISOString(),
                        device_id: null
                      }
                    }
                  : user
              );
              // Re-ordena a lista após a atualização
              return updatedUsers.sort((a, b) => {
                if (a.user_status.status === 'online' && b.user_status.status !== 'online') return -1;
                if (a.user_status.status !== 'online' && b.user_status.status === 'online') return 1;
                return a.full_name.localeCompare(b.full_name);
              });
            };
            
            setUsers(updateUserList);
            setFilteredUsers(updateUserList);
            return;
          }

          const updatedStatus = payload.new;
          
          // Não atualiza se for o usuário atual
          if (updatedStatus.id === session.user.id) {
            console.log('Ignorando atualização do usuário atual');
            return;
          }

          console.log('Atualizando status:', updatedStatus);

          // Atualiza o status do usuário na lista
          const updateUserList = (current: ProcessedUser[]) => {
            const updatedUsers = current.map(user =>
              user.id === updatedStatus.id
                ? {
                    ...user,
                    user_status: {
                      status: updatedStatus.status,
                      last_seen_at: updatedStatus.last_seen_at,
                      device_id: updatedStatus.device_id
                    }
                  }
                : user
            );
            
            console.log('Lista atualizada:', updatedUsers.map(u => ({
              name: u.full_name,
              status: u.user_status?.status
            })));

            // Re-ordena a lista após a atualização
            return updatedUsers.sort((a, b) => {
              if (a.user_status.status === 'online' && b.user_status.status !== 'online') return -1;
              if (a.user_status.status !== 'online' && b.user_status.status === 'online') return 1;
              return a.full_name.localeCompare(b.full_name);
            });
          };

          setUsers(updateUserList);
          setFilteredUsers(updateUserList);
        }
      )
      .subscribe((status) => {
        console.log('Status da inscrição realtime:', status);
      });

    // Atualiza a lista a cada 30 segundos
    const intervalId = setInterval(fetchUsers, 30000);

    // Cleanup
    return () => {
      console.log('Limpando inscrição realtime');
      statusChannel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [session?.user?.id]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = text.toLowerCase();
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'Nunca visto';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    return date.toLocaleDateString();
  };

  if (usersLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Não precisamos mais filtrar usuários inválidos pois todos terão um nome ou fallback
  const onlineUsers = filteredUsers.filter(user => user.user_status?.status === 'online');
  const offlineUsers = filteredUsers.filter(user => user.user_status?.status !== 'online');
  
  console.log('Total de usuários:', filteredUsers.length);
  console.log('Usuários online:', onlineUsers.map(u => ({ name: u.full_name, status: u.user_status?.status })));
  console.log('Usuários offline:', offlineUsers.map(u => ({ name: u.full_name, status: u.user_status?.status })));
  
  const sortedUsers = [...onlineUsers, ...offlineUsers];

  const renderSectionHeader = (title: string, count: number) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title} ({count})
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        showSearch 
        onSearchPress={() => setIsSearching(true)}
        isSearching={isSearching}
        onBackPress={() => {
          setIsSearching(false);
          setSearchQuery('');
          setFilteredUsers(users);
          Keyboard.dismiss();
        }}
      />
      
      {isSearching ? (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar usuários..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilteredUsers(users);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <SectionList
        sections={[
          { 
            title: 'Online', 
            data: onlineUsers
          },
          { 
            title: 'Offline', 
            data: offlineUsers
          }
        ]}
        renderItem={({ item }) => {
          console.log('Renderizando item:', item?.full_name, item?.user_status?.status);
          if (!item || !item.full_name) {
            console.log('Item inválido:', item);
            return null;
          }

          return (
            <TouchableOpacity
              style={[
                styles.userItem,
                { 
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border 
                }
              ]}
              onPress={() => {
                Keyboard.dismiss();
                router.push(`/(chat)/${item.id}`);
              }}
            >
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={styles.avatarText}>
                  {(item.full_name[0] || '?').toUpperCase()}
                </Text>
                {item.user_status?.status === 'online' && (
                  <View style={[styles.onlineIndicator, { borderColor: colors.surface }]} />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {item.full_name}
                </Text>
                <Text 
                  style={[
                    styles.lastSeen, 
                    { 
                      color: item.user_status?.status === 'online' 
                        ? colors.success 
                        : colors.textSecondary 
                    }
                  ]}
                >
                  {item.user_status?.status === 'online' 
                    ? 'online' 
                    : formatLastSeen(item.user_status?.last_seen_at || null)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        renderSectionHeader={({ section: { title, data } }) => 
          renderSectionHeader(title, data.length)
        }
        keyExtractor={(item) => item?.id || 'unknown'}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
    padding: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: 13,
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 