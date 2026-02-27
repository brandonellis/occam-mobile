// Extend expect with React Native Testing Library matchers
require('@testing-library/react-native/build/matchers/extend-expect');

// Silence noisy warnings during tests
jest.spyOn(console, 'warn').mockImplementation((...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('Animated:') || msg.includes('useNativeDriver')) return;
  console.log('[WARN]', ...args);
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
  },
}));

// Mock @stripe/stripe-react-native
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }) => children,
  CardField: () => null,
  useConfirmPayment: () => ({ confirmPayment: jest.fn() }),
  useStripe: () => ({ createPaymentMethod: jest.fn() }),
}));

// Mock @react-navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  setParams: jest.fn(),
  getState: jest.fn(() => ({ routes: [], index: 0 })),
  popToTop: jest.fn(),
  dispatch: jest.fn(),
};

const mockNavigationOverrides = {
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  ...mockNavigationOverrides,
}));

jest.mock('@react-navigation/core', () => ({
  ...jest.requireActual('@react-navigation/core'),
  ...mockNavigationOverrides,
}));
