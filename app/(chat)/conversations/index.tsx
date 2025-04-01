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

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_status: {
    status: string;
    last_seen_at: string | null;
  } | null;
}

export default function ConversationsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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
      setUsersLoading(false);
      return;
    }

    try {
      console.log('Buscando usuários...');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          user_status (
            status,
            last_seen_at
          )
        `)
        .neq('id', session.user.id) // Não busca o usuário atual
        .order('full_name');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        setUsersLoading(false);
        return;
      }

      // Processa os usuários com seus status
      const usersWithStatus = (profiles || []).map(profile => ({
        ...profile,
        user_status: profile.user_status?.[0] || {
          status: 'offline',
          last_seen_at: null
        }
      }));

      console.log('Usuários encontrados:', usersWithStatus.length);
      console.log('Usuários online:', usersWithStatus.filter(u => u.user_status?.status === 'online').length);
      
      // Ordena usuários: online primeiro, depois por nome
      const sortedUsers = usersWithStatus.sort((a, b) => {
        if (a.user_status?.status === 'online' && b.user_status?.status !== 'online') return -1;
        if (a.user_status?.status !== 'online' && b.user_status?.status === 'online') return 1;
        return a.full_name.localeCompare(b.full_name);
      });

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
            const updateUserList = (current: User[]) => {
              const updatedUsers = current.map(user => 
                user.id === payload.old.id
                  ? {
                      ...user,
                      user_status: {
                        status: 'offline',
                        last_seen_at: new Date().toISOString()
                      }
                    }
                  : user
              );
              // Re-ordena a lista após a atualização
              return updatedUsers.sort((a, b) => {
                if (a.user_status?.status === 'online' && b.user_status?.status !== 'online') return -1;
                if (a.user_status?.status !== 'online' && b.user_status?.status === 'online') return 1;
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
          const updateUserList = (current: User[]) => {
            const updatedUsers = current.map(user =>
              user.id === updatedStatus.id
                ? {
                    ...user,
                    user_status: {
                      status: updatedStatus.status,
                      last_seen_at: updatedStatus.last_seen_at
                    }
                  }
                : user
            );
            // Re-ordena a lista após a atualização
            return updatedUsers.sort((a, b) => {
              if (a.user_status?.status === 'online' && b.user_status?.status !== 'online') return -1;
              if (a.user_status?.status !== 'online' && b.user_status?.status === 'online') return 1;
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

  const onlineUsers = filteredUsers.filter(user => user.user_status?.status === 'online');
  const offlineUsers = filteredUsers.filter(user => user.user_status?.status !== 'online');
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
          { title: 'Online', data: onlineUsers },
          { title: 'Offline', data: offlineUsers }
        ]}
        renderItem={({ item }) => (
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
                {item.full_name[0].toUpperCase()}
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
        )}
        renderSectionHeader={({ section: { title, data } }) => 
          renderSectionHeader(title, data.length)
        }
        keyExtractor={(item) => item.id}
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