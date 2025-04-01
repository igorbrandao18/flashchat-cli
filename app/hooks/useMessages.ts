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
}

interface UseMessagesProps {
  chatId: string;
  currentUserId: string;
}

export function useMessages({ chatId, currentUserId }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadCachedMessages = useCallback(async () => {
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
  }, [chatId]);

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

  const fetchMessages = useCallback(async () => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      setSyncing(false);
      return;
    }

    try {
      setSyncing(true);
      console.log('Fetching messages for chat:', { chatId, currentUserId });
      
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', chatId);

      if (sentError) {
        console.error('Error fetching sent messages:', sentError);
        return;
      }

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', chatId)
        .eq('receiver_id', currentUserId);

      if (receivedError) {
        console.error('Error fetching received messages:', receivedError);
        return;
      }

      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      console.log('Fetched messages:', allMessages.length, 'messages');
      setMessages(allMessages);
      if (allMessages.length) {
        markMessagesAsRead(allMessages);
        await cacheMessages(allMessages);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setSyncing(false);
    }
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      return;
    }

    console.log('Initializing chat with:', { chatId, currentUserId });
    
    // Primeiro carrega as mensagens do cache
    loadCachedMessages();
    
    // Depois sincroniza com o servidor
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase.channel(`chat:${chatId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId}))`,
        },
        (payload) => {
          console.log('Realtime message update:', payload);
          
          if (payload.eventType === 'INSERT') {
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
        }
      )
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up chat subscription');
      channel.unsubscribe();
    };
  }, [chatId, currentUserId, fetchMessages, loadCachedMessages]);

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

  const sendMessage = async (content: string) => {
    if (!chatId || !currentUserId || !content.trim()) {
      console.error('Invalid message data:', { chatId, currentUserId, content });
      return null;
    }

    // Criar mensagem local com ID temporário
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      receiver_id: chatId,
      read_at: null,
    };

    // Atualizar UI imediatamente
    setMessages(current => [...current, optimisticMessage]);

    try {
      console.log('Sending message:', content, 'from:', currentUserId, 'to:', chatId);
      const newMessage = {
        content: content.trim(),
        sender_id: currentUserId,
        receiver_id: chatId,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Remover mensagem otimista em caso de erro
        setMessages(current => current.filter(msg => msg.id !== tempId));
        return null;
      }

      console.log('Message sent successfully:', data);
      
      // Substituir mensagem temporária pela real
      setMessages(current => {
        const updatedMessages = current.map(msg => 
          msg.id === tempId ? data : msg
        );
        cacheMessages(updatedMessages);
        return updatedMessages;
      });

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Remover mensagem otimista em caso de erro
      setMessages(current => current.filter(msg => msg.id !== tempId));
      return null;
    }
  };

  return {
    messages,
    loading,
    syncing,
    sendMessage,
    markMessagesAsRead,
  };
} 