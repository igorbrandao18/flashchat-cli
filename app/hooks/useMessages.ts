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
  status?: 'sending' | 'sent' | 'error';
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

    // Verificar autenticação primeiro
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError || !authData.session) {
      console.error('Erro de autenticação ao enviar mensagem:', {
        authError,
        currentUserId,
        sessionUserId: authData.session?.user?.id
      });
      return null;
    }

    // Verificar se o usuário autenticado é o mesmo que está tentando enviar
    if (authData.session.user.id !== currentUserId) {
      console.error('ID do usuário não corresponde ao usuário autenticado:', {
        currentUserId,
        sessionUserId: authData.session.user.id
      });
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
      status: 'sending',
    };

    // Atualizar UI imediatamente
    const updateMessages = (current: Message[]): Message[] => {
      const updatedMessages = [...current, optimisticMessage];
      cacheMessages(updatedMessages).catch(console.error);
      return updatedMessages;
    };
    setMessages(updateMessages);

    try {
      console.log('Tentando enviar mensagem:', {
        content: content.trim(),
        sender_id: currentUserId,
        receiver_id: chatId,
        tempId,
        sessionId: authData.session.user.id
      });

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: content.trim(),
          sender_id: currentUserId,
          receiver_id: chatId,
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Erro detalhado ao enviar mensagem:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          sessionId: authData.session.user.id
        });
        
        // Se for erro de autenticação, tentar reautenticar
        if (error.code === 'PGRST301' || error.code === '42501') {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Erro ao tentar reautenticar:', refreshError);
          }
        }
        
        // Atualizar status da mensagem para erro
        const updateErrorMessages = (current: Message[]): Message[] => {
          const updatedMessages = current.map(msg => 
            msg.id === tempId 
              ? { ...msg, status: 'error' as const }
              : msg
          );
          cacheMessages(updatedMessages).catch(console.error);
          return updatedMessages;
        };
        setMessages(updateErrorMessages);
        return null;
      }

      console.log('Mensagem enviada com sucesso:', {
        tempId,
        newMessageId: data.id,
        data,
        sessionId: authData.session.user.id
      });
      
      // Substituir mensagem temporária pela real
      const updateSuccessMessages = (current: Message[]): Message[] => {
        const updatedMessages = current.map(msg => 
          msg.id === tempId 
            ? { ...data, status: 'sent' as const }
            : msg
        );
        cacheMessages(updatedMessages).catch(console.error);
        return updatedMessages;
      };
      setMessages(updateSuccessMessages);

      return data;
    } catch (error) {
      // Log detalhado do erro
      console.error('Erro detalhado ao enviar mensagem (catch):', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        tempId,
        messageContent: content.trim(),
        sessionId: authData.session.user.id
      });

      // Atualizar status da mensagem para erro
      const updateErrorMessages = (current: Message[]): Message[] => {
        const updatedMessages = current.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'error' as const }
            : msg
        );
        cacheMessages(updatedMessages).catch(console.error);
        return updatedMessages;
      };
      setMessages(updateErrorMessages);
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