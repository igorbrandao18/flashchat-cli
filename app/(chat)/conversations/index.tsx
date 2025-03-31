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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
  online: boolean;
}

export default function ConversationsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    async function fetchUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .neq('id', session.user.id)
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const usersWithOnline = data.map(user => ({ ...user, online: false })) || [];
      setUsers(usersWithOnline);
      setFilteredUsers(usersWithOnline);
      setLoading(false);
    }

    fetchUsers();

    // Subscribe to presence changes
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    });

    // Track current user's presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: session.user.id,
        });
      }
    });

    // Listen to presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUserIds = new Set(
        Object.values(state)
          .flat()
          .map((presence: any) => presence.user_id)
      );

      const updateUsers = (currentUsers: User[]) =>
        currentUsers.map(user => ({
          ...user,
          online: onlineUserIds.has(user.id),
        }));

      setUsers(updateUsers);
      setFilteredUsers(current => updateUsers(current));
    });

    return () => {
      channel.unsubscribe();
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
    if (!lastSeen) return 'Never seen';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderUser = ({ item }: { item: User }) => (
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
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.full_name}
        </Text>
        <Text 
          style={[
            styles.lastSeen, 
            { 
              color: item.online ? colors.success : colors.textSecondary 
            }
          ]}
        >
          {item.online ? 'online' : formatLastSeen(item.last_seen)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search users..."
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
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const onlineUsers = filteredUsers.filter(user => user.online);
  const offlineUsers = filteredUsers.filter(user => !user.online);
  const sortedUsers = [...onlineUsers, ...offlineUsers];

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
      <FlatList
        data={sortedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
        ListHeaderComponent={
          isSearching ? renderSearchBar() : (
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {onlineUsers.length} online
            </Text>
          )
        }
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
    paddingTop: 16,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 16,
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
    borderColor: 'white',
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
}); 