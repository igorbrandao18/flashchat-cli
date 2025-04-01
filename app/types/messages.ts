export type MessageStatus = 'sending' | 'sent' | 'error' | undefined;

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at?: string | null;
  status?: MessageStatus;
} 