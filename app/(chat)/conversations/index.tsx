import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen?: string | null;
  online?: boolean;
}

export default function ConversationsScreen() {
  const [users, setUsers] = useState<User[]>([]);
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

      setUsers(data || []);
      setLoading(false);
    }

    fetchUsers();

    // Subscribe to presence changes
    const channel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setUsers(currentUsers => 
          currentUsers.map(user => ({
            ...user,
            online: Boolean(state[user.id])
          }))
        );
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.user?.id]);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border 
      }]}
      onPress={() => router.push(`/(chat)/${item.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={styles.avatarText}>
          {item.full_name[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.full_name}
        </Text>
        {item.online && (
          <Text style={[styles.onlineStatus, { color: colors.success }]}>
            online
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Loading users...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
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
  loadingText: {
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
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
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineStatus: {
    fontSize: 12,
    marginTop: 2,
  },
}); 