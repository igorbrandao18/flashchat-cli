import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
  Vibration,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnimations } from '@/hooks/useAnimations';
import { supabase } from '@/config/supabase';
import Header from '@/components/Header';

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_status: {
    status: string;
    last_seen_at: string | null;
  } | null;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const { messageAnimation, startEnterAnimation } = useAnimations();
  const inputRef = useRef<TextInput>(null);

  console.log('Chat screen params:', { userId, sessionUserId: session?.user?.id });

  useEffect(() => {
    if (!userId || !session?.user?.id) {
      console.error('Missing required IDs:', { userId, sessionUserId: session?.user?.id });
      setUserLoading(false);
      return;
    }

    async function fetchChatUser() {
      try {
        const { data, error } = await supabase
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
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching chat user:', error);
          setUserLoading(false);
          return;
        }

        console.log('Chat user fetched:', data);
        const chatUser: ChatUser = {
          id: data.id,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          user_status: data.user_status?.[0] || null
        };
        setChatUser(chatUser);
      } catch (error) {
        console.error('Error in fetchChatUser:', error);
      } finally {
        setUserLoading(false);
      }
    }

    fetchChatUser();
  }, [userId, session?.user?.id]);

  const { messages, loading: messagesLoading, syncing, sendMessage } = useMessages({
    chatId: userId,
    currentUserId: session?.user?.id || '',
  });

  const handleSend = async () => {
    if (!message.trim() || !session?.user?.id) return;

    const trimmedMessage = message.trim();
    setMessage('');
    inputRef.current?.focus();
    
    try {
      const result = await sendMessage(trimmedMessage);
      if (!result) {
        setMessage(trimmedMessage);
      } else {
        startEnterAnimation();
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(trimmedMessage);
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isSender = item.sender_id === session?.user?.id;
    const isLastMessage = index === messages.length - 1;

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage,
          {
            backgroundColor: isSender ? colors.secondary : colors.surface,
            ...(isLastMessage ? messageAnimation : {}),
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isSender ? 'white' : colors.text },
          ]}
        >
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              { color: isSender ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </Text>
          {isSender && (
            <Ionicons
              name={item.read_at ? "checkmark-done" : "checkmark"}
              size={16}
              color={item.read_at ? "#34B7F1" : "rgba(255,255,255,0.7)"}
              style={styles.readReceipt}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    return date.toLocaleDateString();
  };

  if (!session?.user?.id) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Error" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Please log in to continue
          </Text>
        </View>
      </View>
    );
  }

  if (userLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Loading..." showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!chatUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Error" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            User not found
          </Text>
        </View>
      </View>
    );
  }

  const userStatus = chatUser.user_status?.status === 'online' 
    ? 'online'
    : chatUser.user_status?.last_seen_at
      ? `Last seen ${formatLastSeen(chatUser.user_status.last_seen_at)}`
      : 'offline';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header 
        title={chatUser.full_name} 
        showBackButton 
      />
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        {userStatus}
      </Text>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          messagesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
          )
        }
      />

      {syncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.syncText, { color: colors.textSecondary }]}>
            Syncing...
          </Text>
        </View>
      )}

      <Animated.View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
            },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? colors.secondary : colors.textSecondary,
              opacity: message.trim() ? 1 : 0.5,
            },
          ]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
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
  errorText: {
    fontSize: 16,
    fontWeight: '500',
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
    borderTopRightRadius: 2,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  readReceipt: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  syncText: {
    fontSize: 12,
    marginLeft: 8,
  },
}); 