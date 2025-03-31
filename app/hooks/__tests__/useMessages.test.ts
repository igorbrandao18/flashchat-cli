import { renderHook, act } from '@testing-library/react-hooks';
import { useMessages } from '../useMessages';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockMessage = {
  id: '1',
  content: 'Test message',
  created_at: '2024-01-01T00:00:00Z',
  sender_id: 'user1',
  receiver_id: 'user2',
  read_at: null,
};

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

describe('useMessages', () => {
  let mockSelect: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockInsert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Setup Supabase mock with proper chaining
    mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    mockUpdate = jest.fn();
    mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockMessage, error: null }),
      }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    }));
  });

  it('should initialize with empty messages and loading state', async () => {
    const { result } = renderHook(() =>
      useMessages({ chatId: 'user2', currentUserId: 'user1' })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.messages).toEqual([]);

    // Wait for loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
  });

  it('should load cached messages on mount', async () => {
    const cachedMessages = [mockMessage];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedMessages));

    const { result } = renderHook(() =>
      useMessages({ chatId: 'user2', currentUserId: 'user1' })
    );

    // Wait for loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.messages).toEqual(cachedMessages);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@messages:user2');
  });

  it('should send a message successfully', async () => {
    const newMessage = { ...mockMessage, content: 'New message' };
    const mockInsertResponse = { data: newMessage, error: null };

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockInsertResponse),
      }),
    });

    const { result } = renderHook(() =>
      useMessages({ chatId: 'user2', currentUserId: 'user1' })
    );

    // Wait for initial loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let sentMessage;
    await act(async () => {
      sentMessage = await result.current.sendMessage('New message');
    });

    expect(sentMessage).toEqual(newMessage);
    expect(result.current.messages).toContainEqual(newMessage);
  });

  it('should handle message sending failure', async () => {
    const mockError = { message: 'Failed to send message' };

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }),
    });

    const { result } = renderHook(() =>
      useMessages({ chatId: 'user2', currentUserId: 'user1' })
    );

    // Wait for initial loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let sentMessage;
    await act(async () => {
      sentMessage = await result.current.sendMessage('Failed message');
    });

    expect(sentMessage).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  it('should mark messages as read', async () => {
    const unreadMessage = { ...mockMessage, read_at: null };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([unreadMessage]));

    const mockInFn = jest.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({
      in: mockInFn,
    });

    const { result } = renderHook(() =>
      useMessages({ chatId: 'user2', currentUserId: unreadMessage.receiver_id })
    );

    // Wait for initial loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.markMessagesAsRead([unreadMessage]);
    });

    expect(supabase.from).toHaveBeenCalledWith('messages');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInFn).toHaveBeenCalledWith('id', [unreadMessage.id]);
  });
}); 