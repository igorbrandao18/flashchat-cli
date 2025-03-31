import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function NewChatScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', session.user.id)
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    }

    fetchUsers();
  }, [session?.user?.id]);

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/(chat)/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.full_name[0].toUpperCase()}
        </Text>
      </View>
      <Text style={styles.userName}>{item.full_name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="New Chat"
        showBackButton
      />
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#667781" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#667781"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  list: {
    backgroundColor: '#FFFFFF',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    color: '#000000',
  },
}); 