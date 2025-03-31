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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/config/supabase';
import Header from '@/components/Header';

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
}

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const { messages, loading: messagesLoading, sendMessage } = useMessages({
    chatId: userId as string,
    currentUserId: session?.user?.id || '',
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    
    async function fetchChatUser() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching chat user:', error);
        return;
      }

      setChatUser(data);
      setUserLoading(false);
    }

    fetchChatUser();
  }, [userId, session?.user?.id]);

  const handleSend = async () => {
    if (!message.trim() || !session?.user?.id) return;

    const trimmedMessage = message.trim();
    setMessage('');
    await sendMessage(trimmedMessage);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isSender = item.sender_id === session?.user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage,
          {
            backgroundColor: isSender ? colors.secondary : colors.surface,
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
      </View>
    );
  };

  if (userLoading || messagesLoading) {
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header title={chatUser.full_name} showBackButton />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TextInput
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
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.secondary }]}
          onPress={handleSend}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
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
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
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
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 