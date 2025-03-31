import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  lastMessage: {
    content: string;
    created_at: string;
  } | null;
}

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const fetchConversations = async () => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          profiles!receiver_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Group messages by conversation partner
      const conversationsMap = new Map<string, Conversation>();
      messages?.forEach((message: any) => {
        const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            user: {
              id: partnerId,
              full_name: message.profiles.full_name,
              avatar_url: message.profiles.avatar_url,
            },
            lastMessage: {
              content: message.content,
              created_at: message.created_at,
            },
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
      setLoading(false);
    };

    fetchConversations();
  }, [session?.user?.id]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/(chat)/${item.user.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.user.full_name[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.full_name}</Text>
          {item.lastMessage && (
            <Text style={styles.messageTime}>
              {formatTime(item.lastMessage.created_at)}
            </Text>
          )}
        </View>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(chat)/new-chat')}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#075E54',
    fontSize: 16,
  },
  listContent: {
    backgroundColor: '#FFFFFF',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
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
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    color: '#667781',
  },
  lastMessage: {
    fontSize: 14,
    color: '#667781',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#25D366',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 