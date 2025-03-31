create policy "Users can mark messages as read" on messages for update using (auth.uid() = receiver_id);
