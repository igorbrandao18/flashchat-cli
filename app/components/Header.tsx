import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function Header({ title = "WhatsApp", showBackButton = false }: HeaderProps) {
  const { signOut } = useAuth();

  return (
    <>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="camera-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="search" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={signOut}>
              <Ionicons name="ellipsis-vertical" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="people" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>CHATS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>STATUS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>CALLS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#075E54',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 