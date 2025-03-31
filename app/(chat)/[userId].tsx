import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/ChatHeader';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [lastSeen, setLastSeen] = useState<string>('online');
  const flatListRef = useRef<FlatList>(null);

  // Fetch chat user details
  useEffect(() => {
    async function fetchChatUser() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching chat user:', error);
        return;
      }

      setChatUser(data);
    }

    fetchChatUser();

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const userState = presenceSubscription.presenceState()[userId];
        if (userState) {
          setLastSeen('online');
        } else {
          setLastSeen('last seen today at 12:00');
        }
      })
      .subscribe();

    return () => {
      presenceSubscription.unsubscribe();
    };
  }, [userId]);

  // Fetch messages
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    }

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${session.user.id},receiver_id=eq.${userId}`,
      }, (payload) => {
        setMessages(current => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage.trim(),
        sender_id: session.user.id,
        receiver_id: userId,
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.sender_id === session?.user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isSender ? styles.sentMessage : styles.receivedMessage
      ]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ChatHeader 
        title={chatUser?.full_name || 'Chat'}
        lastSeen={lastSeen}
        avatarUrl={chatUser?.avatar_url}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
            placeholderTextColor="#8E8E93"
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? '#075E54' : '#8E8E93'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4DDD6',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 