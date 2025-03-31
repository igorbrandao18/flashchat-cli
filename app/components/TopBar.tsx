import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function TopBar() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0088FF" />
      <View style={styles.content}>
        <TouchableOpacity style={styles.leftButton}>
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.leftButtonText}>Câmera</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conversations</Text>
        <TouchableOpacity style={styles.rightButton} onPress={signOut}>
          <Text style={styles.rightButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0088FF',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  content: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  rightButton: {
    justifyContent: 'center',
  },
  rightButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
}); 