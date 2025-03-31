// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(),
      subscribe: jest.fn(),
    })),
  },
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {
    StatusBarManager: {
      getHeight: jest.fn(),
    },
  },
  Animated: {
    Value: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    createAnimatedComponent: (component) => component,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: (styles) => styles,
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: () => ({}),
  withSpring: () => ({}),
  withTiming: () => ({}),
  useSharedValue: () => ({ value: 0 }),
  useAnimatedScrollHandler: () => ({}),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {},
}));

// Set up window object
global.window = global; 