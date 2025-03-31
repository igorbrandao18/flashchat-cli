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
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnimations } from '@/hooks/useAnimations';
import { supabase } from '@/config/supabase';
import Header from '@/components/Header';
import { Message } from '@/hooks/useMessages';

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const { messageAnimation, startEnterAnimation } = useAnimations();
  const inputRef = useRef<TextInput>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { messages, loading: messagesLoading, sendMessage, setMessages } = useMessages({
    chatId: userId,
    currentUserId: session?.user?.id || '',
  });

  console.log('Chat screen params:', { userId, sessionUserId: session?.user?.id });

  useEffect(() => {
    if (!userId || !session?.user?.id) {
      console.error('Missing required IDs:', { userId, sessionUserId: session?.user?.id });
      return;
    }

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

      console.log('Chat user fetched:', data);
      setChatUser(data);
      setUserLoading(false);
    }

    fetchChatUser();
  }, [userId, session?.user?.id]);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (audioPlayer) {
        audioPlayer.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !session?.user?.id || isSending) return;

    const trimmedMessage = message.trim();
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: trimmedMessage,
      sender_id: session.user.id,
      receiver_id: userId,
      created_at: new Date().toISOString(),
      read_at: null,
      message_type: 'text',
    };

    // Limpa o input e fecha o teclado imediatamente
    setMessage('');
    Keyboard.dismiss();
    
    // Adiciona a mensagem otimista ao estado
    setMessages((current: Message[]) => [...current, optimisticMessage]);
    
    // Feedback tátil
    Vibration.vibrate(50);
    startEnterAnimation();

    // Scroll para o final
    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      setIsSending(true);
      const result = await sendMessage(trimmedMessage);
      
      if (result) {
        // Substitui a mensagem temporária pela real
        setMessages((current: Message[]) => 
          current.map((msg: Message) => 
            msg.id === optimisticMessage.id ? result : msg
          )
        );
      } else {
        // Remove a mensagem otimista em caso de erro
        setMessages((current: Message[]) => 
          current.filter((msg: Message) => msg.id !== optimisticMessage.id)
        );
        setMessage(trimmedMessage); // Restaura a mensagem no input
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove a mensagem otimista em caso de erro
      setMessages((current: Message[]) => 
        current.filter((msg: Message) => msg.id !== optimisticMessage.id)
      );
      setMessage(trimmedMessage); // Restaura a mensagem no input
    } finally {
      setIsSending(false);
    }
  };

  const stopRecording = async () => {
    if (!recording || !session?.user?.id) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      if (uri) {
        // Cria uma mensagem otimista para o áudio
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          content: '🎤 Voice message',
          sender_id: session.user.id,
          receiver_id: userId,
          created_at: new Date().toISOString(),
          read_at: null,
          message_type: 'audio',
          file_url: uri, // URL temporária local
        };

        // Adiciona a mensagem otimista ao estado
        setMessages((current: Message[]) => [...current, optimisticMessage]);
        
        // Scroll para o final
        flatListRef.current?.scrollToEnd({ animated: true });
        
        setIsSending(true);
        
        try {
          const fileName = `audio_${Date.now()}.m4a`;
          const filePath = `audio/${fileName}`;
          
          const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          
          const { data: fileData, error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, fileContent, {
              contentType: 'audio/m4a',
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

          const result = await sendMessage('🎤 Voice message', 'audio', publicUrl);
          
          if (result) {
            // Substitui a mensagem temporária pela real
            setMessages((current: Message[]) => 
              current.map((msg: Message) => 
                msg.id === optimisticMessage.id ? result : msg
              )
            );
          } else {
            // Remove a mensagem otimista em caso de erro
            setMessages((current: Message[]) => 
              current.filter((msg: Message) => msg.id !== optimisticMessage.id)
            );
          }
          
          // Limpar arquivo temporário
          await FileSystem.deleteAsync(uri, { idempotent: true });
          
        } catch (error) {
          console.error('Error sending audio:', error);
          // Remove a mensagem otimista em caso de erro
          setMessages((current: Message[]) => 
            current.filter((msg: Message) => msg.id !== optimisticMessage.id)
          );
        } finally {
          setIsSending(false);
        }
      }
      
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsSending(false);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (err) {
      console.error('Failed to cancel recording', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = async (messageId: string, audioUrl: string) => {
    try {
      // Se já existe um player, para a reprodução atual
      if (audioPlayer) {
        await audioPlayer.unloadAsync();
        setAudioPlayer(null);
        setPlayingMessageId(null);
        setIsPlaying(false);
      }

      if (playingMessageId === messageId && isPlaying) {
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setPlayingMessageId(null);
            setIsPlaying(false);
          }
        }
      });

      setAudioPlayer(sound);
      setPlayingMessageId(messageId);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isSender = item.sender_id === session?.user?.id;
    const isLastMessage = index === messages.length - 1;
    const isAudioMessage = item.message_type === 'audio';
    const isTemporary = item.id.startsWith('temp-');

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage,
          {
            backgroundColor: isSender ? '#E7FFDB' : '#FFFFFF',
            opacity: isTemporary ? 0.7 : 1,
            ...(isLastMessage ? messageAnimation : {}),
          },
        ]}
      >
        {isAudioMessage ? (
          <TouchableOpacity 
            style={styles.audioContainer}
            onPress={() => item.file_url && playAudio(item.id, item.file_url)}
            disabled={isTemporary}
          >
            <Ionicons
              name={playingMessageId === item.id && isPlaying ? "pause" : "play"}
              size={24}
              color="#075E54"
            />
            <View style={styles.audioWaveform}>
              <View style={[styles.audioLine, styles.audioLineShort]} />
              <View style={[styles.audioLine, styles.audioLineMedium]} />
              <View style={[styles.audioLine, styles.audioLineLong]} />
              <View style={[styles.audioLine, styles.audioLineMedium]} />
              <View style={[styles.audioLine, styles.audioLineShort]} />
            </View>
            <Text style={styles.audioLabel}>Voice Message</Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.messageText,
              { color: '#000000' },
            ]}
          >
            {item.content}
          </Text>
        )}
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              { 
                color: isSender ? 'rgba(0,0,0,0.5)' : colors.textSecondary,
                opacity: isTemporary ? 0.5 : 1,
              },
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
              name={isTemporary ? "time-outline" : (item.read_at ? "checkmark-done" : "checkmark")}
              size={16}
              color={item.read_at ? "#34B7F1" : "rgba(0,0,0,0.5)"}
              style={[styles.readReceipt, { opacity: isTemporary ? 0.5 : 1 }]}
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
      style={[styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header title={chatUser.full_name} showBackButton />
      <View style={styles.chatBackground}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          style={styles.flatList}
        />
      </View>
      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <Animated.View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRecording} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                  backgroundColor: message.trim() ? '#00A884' : colors.textSecondary,
                  transform: [{ scale: message.trim() ? 1 : 0.9 }],
                },
              ]}
              onPress={message.trim() ? handleSend : startRecording}
              onLongPress={startRecording}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name={message.trim() ? "send" : "mic"} 
                  size={20} 
                  color="white" 
                />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00A884', // Cor do header do WhatsApp
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#E5DDD5', // Cor de fundo do chat do WhatsApp
  },
  flatList: {
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 2,
    backgroundColor: '#E7FFDB', // Cor das mensagens enviadas do WhatsApp
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 2,
    backgroundColor: '#FFFFFF', // Cor das mensagens recebidas do WhatsApp
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
    backgroundColor: '#F0F2F5', // Cor do container de input do WhatsApp
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#FFFFFF', // Cor do input do WhatsApp
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingTimer: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
  },
  cancelButton: {
    marginHorizontal: 8,
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00A884',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 150,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    height: 24,
    justifyContent: 'center',
  },
  audioLine: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1,
    backgroundColor: '#075E54',
  },
  audioLineShort: {
    height: '40%',
  },
  audioLineMedium: {
    height: '60%',
  },
  audioLineLong: {
    height: '80%',
  },
  audioLabel: {
    fontSize: 12,
    color: '#075E54',
    marginLeft: 8,
    opacity: 0.7,
  },
}); 