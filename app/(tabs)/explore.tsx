import React from 'react';
import { View, ScrollView, StyleSheet, Image, Platform } from 'react-native';

import Collapsible from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  return (
    <ScrollView style={styles.container}>
      <Collapsible title="About FlashChat">
        <View style={styles.content}>
          {/* Add content here */}
        </View>
      </Collapsible>

      <Collapsible title="Features">
        <View style={styles.content}>
          {/* Add content here */}
        </View>
      </Collapsible>

      <Collapsible title="Help & Support">
        <View style={styles.content}>
          {/* Add content here */}
        </View>
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  content: {
    paddingVertical: 8,
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
