-- Habilita as extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMP WITH TIME ZONE,
    message_type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança
CREATE POLICY "Users can view their own messages"
    ON public.messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (auth.uid() = sender_id);

-- Habilita realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Função para atualizar o timestamp de leitura
CREATE OR REPLACE FUNCTION public.mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read_at IS NULL AND NEW.receiver_id = auth.uid() THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para marcar mensagem como lida
CREATE TRIGGER mark_message_as_read_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_message_as_read();

-- Concede permissões necessárias
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 