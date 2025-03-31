import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

export default function ChatLayout() {
  const { signOut } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={signOut}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: '#fff' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="conversations/index"
        options={{
          title: 'Conversations',
        }}
      />
      <Stack.Screen
        name="[userId]"
        options={{
          title: 'Chat',
        }}
      />
    </Stack>
  );
} 