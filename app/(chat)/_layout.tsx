import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the default header
      }}
    >
      <Stack.Screen
        name="conversations/index"
      />
      <Stack.Screen
        name="[userId]"
      />
    </Stack>
  );
} 