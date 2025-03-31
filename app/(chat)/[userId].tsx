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
  last_seen: string | null;
}

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const { messageAnimation, startEnterAnimation } = useAnimations();
  const inputRef = useRef<TextInput>(null);

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
    if (!message.trim() || !session?.user?.id || isSending) return;

    const trimmedMessage = message.trim();
    setMessage('');
    setIsSending(true);
    Keyboard.dismiss();
    Vibration.vibrate(50); // Haptic feedback

    try {
      await sendMessage(trimmedMessage);
      startEnterAnimation();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(trimmedMessage); // Restore message if failed
    } finally {
      setIsSending(false);
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
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? colors.secondary : colors.textSecondary,
              transform: [{ scale: message.trim() ? 1 : 0.9 }],
            },
          ]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
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
}); 