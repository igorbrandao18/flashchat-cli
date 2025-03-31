import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at: string | null;
  message_type: 'text' | 'audio';
  file_url?: string;
}

interface UseMessagesProps {
  chatId: string;
  currentUserId: string;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, type?: 'text' | 'audio', fileUrl?: string) => Promise<Message | null>;
  markMessagesAsRead: (messagesToMark: Message[]) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useMessages({ chatId, currentUserId }: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching messages for chat:', { chatId, currentUserId });
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched messages:', data?.length, 'messages');
      setMessages(data || []);
      setLoading(false);
      
      if (data?.length) {
        markMessagesAsRead(data);
        await cacheMessages(data);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setLoading(false);
    }
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      return;
    }

    console.log('Initializing chat with:', { chatId, currentUserId });
    loadCachedMessages();
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase.channel('messages');

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId}))`,
        },
        (payload) => {
          console.log('Realtime message update:', payload);
          
          const newMessage = payload.new as Message;
          console.log('New message received:', newMessage);
          
          setMessages((current) => {
            // Avoid duplicate messages
            if (current.some(msg => msg.id === newMessage.id)) {
              return current;
            }
            const updatedMessages = [...current, newMessage];
            cacheMessages(updatedMessages);
            return updatedMessages;
          });

          // Mark message as read if we're the receiver
          if (newMessage.receiver_id === currentUserId) {
            markMessagesAsRead([newMessage]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up chat subscription');
      channel.unsubscribe();
    };
  }, [chatId, currentUserId, fetchMessages]);

  const loadCachedMessages = async () => {
    if (!chatId) return;

    try {
      const cached = await AsyncStorage.getItem(`@messages:${chatId}`);
      if (cached) {
        const parsedMessages = JSON.parse(cached);
        console.log('Loaded cached messages:', parsedMessages.length);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  };

  const cacheMessages = async (newMessages: Message[]) => {
    if (!chatId) return;

    try {
      await AsyncStorage.setItem(
        `@messages:${chatId}`,
        JSON.stringify(newMessages)
      );
      console.log('Messages cached successfully');
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  };

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    if (!currentUserId) return;

    const unreadMessages = messagesToMark.filter(
      (msg) => msg.receiver_id === currentUserId && !msg.read_at
    );

    if (unreadMessages.length === 0) return;

    try {
      console.log('Marking messages as read:', unreadMessages.length);
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in(
          'id',
          unreadMessages.map((msg) => msg.id)
        );

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'audio' = 'text', fileUrl?: string) => {
    if (!chatId || !currentUserId || !content.trim()) {
      console.error('Invalid message data:', { chatId, currentUserId, content });
      return null;
    }

    try {
      console.log('Sending message:', { content, type, fileUrl }, 'from:', currentUserId, 'to:', chatId);
      const newMessage = {
        content: content.trim(),
        sender_id: currentUserId,
        receiver_id: chatId,
        message_type: type,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      console.log('Message sent successfully:', data);
      
      // Update local messages immediately
      setMessages(current => {
        // Evita mensagens duplicadas
        if (current.some(msg => msg.id === data.id)) {
          return current;
        }
        const updatedMessages = [...current, data].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        cacheMessages(updatedMessages);
        return updatedMessages;
      });

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead,
    setMessages,
  };
} 