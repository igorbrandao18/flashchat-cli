import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at: string | null;
}

interface UseMessagesProps {
  chatId: string;
  currentUserId: string;
}

export function useMessages({ chatId, currentUserId }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCachedMessages();
    fetchMessages();
    subscribeToMessages();

    return () => {
      supabase.channel('messages').unsubscribe();
    };
  }, [chatId]);

  const loadCachedMessages = async () => {
    try {
      const cached = await AsyncStorage.getItem(`@messages:${chatId}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  };

  const cacheMessages = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem(
        `@messages:${chatId}`,
        JSON.stringify(newMessages)
      );
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
    cacheMessages(data || []);
    setLoading(false);
    markMessagesAsRead(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId},receiver_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((current) => {
              const newMessages = [...current, payload.new as Message];
              cacheMessages(newMessages);
              return newMessages;
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages((current) =>
              current.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    const unreadMessages = messagesToMark.filter(
      (msg) => msg.receiver_id === currentUserId && !msg.read_at
    );

    if (unreadMessages.length === 0) return;

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
  };

  const sendMessage = async (content: string) => {
    const message = {
      content,
      sender_id: currentUserId,
      receiver_id: chatId,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  };

  return {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead,
  };
} 