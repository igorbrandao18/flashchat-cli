import { create } from 'zustand';
import { Message } from '@/types/messages';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MessagesState {
  messages: Record<string, Message[]>;
  loading: Record<string, boolean>;
  syncing: Record<string, boolean>;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  setLoading: (chatId: string, loading: boolean) => void;
  setSyncing: (chatId: string, syncing: boolean) => void;
  loadCachedMessages: (chatId: string) => Promise<void>;
  cacheMessages: (chatId: string, messages: Message[]) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  messages: {},
  loading: {},
  syncing: {},

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const withoutTemp = currentMessages.filter(
        msg => !msg.id.startsWith('temp-') || 
        (msg.id.startsWith('temp-') && msg.content !== message.content)
      );

      if (withoutTemp.some(msg => msg.id === message.id)) {
        return state;
      }

      const updatedMessages = [...withoutTemp, message].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
      };
    }),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const updatedMessages = currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
      };
    }),

  removeMessage: (chatId, messageId) =>
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
      };
    }),

  setLoading: (chatId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [chatId]: loading,
      },
    })),

  setSyncing: (chatId, syncing) =>
    set((state) => ({
      syncing: {
        ...state.syncing,
        [chatId]: syncing,
      },
    })),

  loadCachedMessages: async (chatId) => {
    try {
      const cached = await AsyncStorage.getItem(`@messages:${chatId}`);
      if (cached) {
        const parsedMessages = JSON.parse(cached);
        console.log('Loaded cached messages:', parsedMessages.length);
        get().setMessages(chatId, parsedMessages);
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  },

  cacheMessages: async (chatId, messages) => {
    try {
      await AsyncStorage.setItem(
        `@messages:${chatId}`,
        JSON.stringify(messages)
      );
      console.log('Messages cached successfully');
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  },
})); 