import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  isSearching?: boolean;
  onSearchPress?: () => void;
  onBackPress?: () => void;
}

export default function Header({ 
  title = "FlashChat", 
  showBackButton = false,
  showSearch = false,
  isSearching = false,
  onSearchPress,
  onBackPress,
}: HeaderProps) {
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();

  const handleBack = () => {
    if (isSearching && onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar 
        backgroundColor={colors.primary} 
        barStyle={theme === 'dark' ? "light-content" : "dark-content"} 
      />
      <View style={styles.content}>
        {(showBackButton || isSearching) ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ) : null}
        {!isSearching && (
          <Text style={[styles.title, (showBackButton || isSearching) && styles.titleWithBack, { color: 'white' }]}>
            {title}
          </Text>
        )}
        <View style={styles.actions}>
          {!isSearching && (
            <>
              {showSearch && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={onSearchPress}
                >
                  <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={toggleTheme}>
                <Ionicons 
                  name={theme === 'dark' ? "sunny" : "moon"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 16,
  },
  titleWithBack: {
    marginLeft: 0,
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
}); 