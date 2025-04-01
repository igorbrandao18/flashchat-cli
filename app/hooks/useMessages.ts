import { useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useMessagesStore } from '@/stores/messagesStore';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import { Message, MessageStatus } from '@/types/messages';

interface UseMessagesProps {
  chatId: string;
  currentUserId: string;
}

export function useMessages({ chatId, currentUserId }: UseMessagesProps) {
  const {
    messages: allMessages,
    loading: allLoading,
    syncing: allSyncing,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setLoading,
    setSyncing,
    loadCachedMessages,
    cacheMessages
  } = useMessagesStore();

  const messages = allMessages[chatId] || [];
  const loading = allLoading[chatId] || false;
  const syncing = allSyncing[chatId] || false;

  const fetchMessages = useCallback(async () => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      setSyncing(chatId, false);
      return;
    }

    try {
      setSyncing(chatId, true);
      console.log('Buscando mensagens para o chat:', { chatId, currentUserId });
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),` +
          `and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }

      if (messages && messages.length > 0) {
        setMessages(chatId, messages);
        markMessagesAsRead(messages);
        await cacheMessages(chatId, messages);
      } else {
        console.log('Nenhuma mensagem encontrada para esta conversa');
        setMessages(chatId, []);
      }
    } catch (error) {
      console.error('Erro em fetchMessages:', error);
    } finally {
      setSyncing(chatId, false);
    }
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      console.error('Invalid IDs:', { chatId, currentUserId });
      return;
    }

    console.log('Inicializando chat:', { chatId, currentUserId });
    
    // Primeiro carrega as mensagens do cache
    loadCachedMessages(chatId);
    
    // Depois sincroniza com o servidor
    fetchMessages();

    // Configura canal realtime com broadcast
    const channel = supabase.channel(`chat:${chatId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: currentUserId },
      },
    });

    // Inscreve para mudanças em tempo real
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id.eq.${currentUserId}.and.receiver_id.eq.${chatId}).or.(sender_id.eq.${chatId}.and.receiver_id.eq.${currentUserId})`,
        },
        (payload) => {
          console.log('Atualização em tempo real:', {
            tipo: payload.eventType,
            dados: payload.new
          });
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            console.log('Nova mensagem recebida:', {
              id: newMessage.id,
              content: newMessage.content,
              sender: newMessage.sender_id,
              receiver: newMessage.receiver_id
            });
            
            addMessage(chatId, {
              ...newMessage,
              status: newMessage.sender_id === currentUserId ? ('sent' as const) : undefined
            });

            // Se somos o destinatário, marca como lida
            if (newMessage.receiver_id === currentUserId) {
              markMessagesAsRead([newMessage]);
            }

            // Atualiza cache
            cacheMessages(chatId, messages);
          }
        }
      )
      .subscribe(async (status) => {
        console.log('Status do canal:', status);
        if (status === 'SUBSCRIBED') {
          // Entra na sala quando conecta
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: currentUserId
          });
        }
      });

    return () => {
      console.log('Limpando inscrição e presence');
      channel.untrack();
      channel.unsubscribe();
    };
  }, [chatId, currentUserId, fetchMessages]);

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

    // Cria mensagem temporária para exibição imediata
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      receiver_id: chatId,
      status: 'sending' as const
    };

    // Adiciona mensagem temporária à lista
    addMessage(chatId, tempMessage);

    try {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: currentUserId,
          receiver_id: chatId
        })
        .select('*')
        .single();

      if (error) throw error;

      // Remove mensagem temporária e adiciona a real
      removeMessage(chatId, tempId);
      addMessage(chatId, { ...newMessage, status: 'sent' as const });

      return { success: true, message: newMessage };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Atualiza status da mensagem temporária para erro
      updateMessage(chatId, tempId, { status: 'error' as const });

      return { success: false, error };
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