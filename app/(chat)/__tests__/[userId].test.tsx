import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import ChatScreen from '../[userId]';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/config/supabase';

// Mock the hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useMessages', () => ({
  useMessages: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ userId: 'test-user-id' }),
}));

// Mock Supabase client
jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ChatScreen', () => {
  const mockSession = {
    user: { id: 'current-user-id' },
  };

  const mockMessages = [
    {
      id: '1',
      content: 'Hello',
      created_at: new Date().toISOString(),
      sender_id: 'current-user-id',
      receiver_id: 'test-user-id',
      read_at: null,
    },
  ];

  const mockChatUser = {
    id: 'test-user-id',
    full_name: 'Test User',
    avatar_url: null,
    last_seen: new Date().toISOString(),
  };

  const mockTheme = {
    colors: {
      background: '#ffffff',
      surface: '#f5f5f5',
      primary: '#007AFF',
      secondary: '#5856D6',
      text: '#000000',
      textSecondary: '#666666',
      error: '#FF3B30',
      inputBackground: '#e8e8e8',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({ session: mockSession });
    (useMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      loading: false,
      sendMessage: jest.fn().mockResolvedValue(mockMessages[0]),
    });
    (useTheme as jest.Mock).mockReturnValue(mockTheme);

    const mockSupabaseResponse = {
      data: mockChatUser,
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockSupabaseResponse),
    });
  });

  it('renders loading state initially', () => {
    (useMessages as jest.Mock).mockReturnValue({
      messages: [],
      loading: true,
      sendMessage: jest.fn(),
    });

    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders chat interface when data is loaded', async () => {
    const { getByPlaceholderText, getByText } = render(<ChatScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Type a message...')).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('Hello')).toBeTruthy();
    });
  });

  it('handles message sending', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue(mockMessages[0]);
    (useMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      loading: false,
      sendMessage: mockSendMessage,
    });

    const { getByPlaceholderText, getByTestId } = render(<ChatScreen />);

    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByTestId('send-button');

    await act(async () => {
      fireEvent.changeText(input, 'New message');
      fireEvent.press(sendButton);
    });

    expect(mockSendMessage).toHaveBeenCalledWith('New message');
    expect(input.props.value).toBe('');
  });

  it('shows error state when chat user is not found', async () => {
    const mockSupabaseErrorResponse = {
      data: null,
      error: new Error('User not found'),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockSupabaseErrorResponse),
    });

    const { getByText } = render(<ChatScreen />);

    await waitFor(() => {
      expect(getByText('User not found')).toBeTruthy();
    });
  });

  it('disables send button when message is empty', () => {
    const { getByTestId } = render(<ChatScreen />);
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('enables send button when message is not empty', async () => {
    const { getByPlaceholderText, getByTestId } = render(<ChatScreen />);
    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByTestId('send-button');

    await act(async () => {
      fireEvent.changeText(input, 'New message');
    });

    expect(sendButton.props.disabled).toBe(false);
  });

  it('displays message timestamp correctly', () => {
    const { getByText } = render(<ChatScreen />);
    const timestamp = new Date(mockMessages[0].created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(getByText(timestamp)).toBeTruthy();
  });
}); 