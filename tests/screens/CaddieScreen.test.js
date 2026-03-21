import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CaddieScreen from '../../src/screens/Caddie/CaddieScreen';
import useCaddie from '../../src/hooks/useCaddie';
import useAuth from '../../src/hooks/useAuth';
import useMarshalIntent from '../../src/hooks/useMarshalIntent';
import { navigate, navigationRef } from '../../src/helpers/navigation.helper';
import { ROLES } from '../../src/constants/auth.constants';
import { SCREENS } from '../../src/constants/navigation.constants';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('../../src/hooks/useCaddie', () => jest.fn());
jest.mock('../../src/hooks/useAuth', () => jest.fn());
jest.mock('../../src/hooks/useMarshalIntent', () => jest.fn());
jest.mock('../../src/helpers/navigation.helper', () => ({
  navigate: jest.fn(),
  navigationRef: { current: { isReady: jest.fn(() => true) } },
}));

const mockUseCaddie = useCaddie;
const mockUseAuth = useAuth;
const mockDeliverIntent = jest.fn();

const buildCaddieState = () => ({
  dismissNudge: jest.fn(),
  error: null,
  input: '',
  isConnected: true,
  isLoading: false,
  messages: [
    {
      id: 'handoff-message',
      sender: 'assistant',
      text: 'Caddie recommends a Marshal handoff.',
      type: 'handoff',
      handoff: {
        target: 'marshal',
        reason: 'booking_support',
        title: 'Marshal follow-up recommended',
        summary: 'This request needs facility-side booking support.',
        prompt: 'Client handoff from Caddie\nReason: booking_support\nClient request: I need help with my booking',
      },
    },
  ],
  nudges: [],
  resetConversation: jest.fn(),
  runHealthCheck: jest.fn(),
  selectSuggestion: jest.fn(),
  sendCurrentMessage: jest.fn(),
  sendMessage: jest.fn(),
  setInput: jest.fn(),
  suggestions: [],
});

describe('CaddieScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseCaddie.mockReturnValue(buildCaddieState());
    useMarshalIntent.mockReturnValue({
      deliverIntent: mockDeliverIntent,
      consumeIntent: jest.fn(),
    });
  });

  test('delivers intent via context and navigates after role switch for dual-role staff users', async () => {
    const switchRole = jest.fn().mockResolvedValue(undefined);
    navigationRef.current.isReady.mockReturnValue(true);

    mockUseAuth.mockReturnValue({
      user: {
        roles: ['client', 'coach'],
      },
      activeRole: ROLES.CLIENT,
      isDualRole: true,
      switchRole,
    });

    const { getByText } = render(<CaddieScreen />);

    fireEvent.press(getByText('Open in Marshal'));

    await waitFor(() => {
      expect(switchRole).toHaveBeenCalledWith(ROLES.COACH);
    });

    // deliverIntent should be called BEFORE switchRole navigation
    expect(mockDeliverIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Reason: booking_support'),
        handoff: expect.objectContaining({
          target: 'marshal',
        }),
      })
    );

    // Navigate should NOT pass marshalIntent in params — intent is in context
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(SCREENS.COACH_TABS, {
        screen: SCREENS.MARSHAL,
      });
    });
  });

  test('does not show a Marshal handoff action for client-only users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['client'],
      },
      activeRole: ROLES.CLIENT,
      isDualRole: false,
      switchRole: jest.fn(),
    });

    const { queryByText } = render(<CaddieScreen />);

    expect(queryByText('Open in Marshal')).toBeNull();
  });

  test('shows an error and does not navigate when switching to Marshal fails', async () => {
    const switchRole = jest.fn().mockRejectedValue(new Error('Role switch failed'));

    mockUseAuth.mockReturnValue({
      user: {
        roles: ['client', 'coach'],
      },
      activeRole: ROLES.CLIENT,
      isDualRole: true,
      switchRole,
    });

    const { getByText, queryByText } = render(<CaddieScreen />);

    fireEvent.press(getByText('Open in Marshal'));

    await waitFor(() => {
      expect(switchRole).toHaveBeenCalledWith(ROLES.COACH);
    });

    await waitFor(() => {
      expect(getByText('We couldn\'t open Marshal right now. Please try again.')).toBeTruthy();
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(queryByText('Open in Marshal')).toBeTruthy();
  });

  test('delivers intent and navigates without role switch when already in target role', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['client', 'coach'],
      },
      activeRole: ROLES.COACH,
      isDualRole: true,
      switchRole: jest.fn(),
    });

    const { getByText } = render(<CaddieScreen />);

    fireEvent.press(getByText('Open in Marshal'));

    await waitFor(() => {
      expect(mockDeliverIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Reason: booking_support'),
        })
      );
    });

    expect(navigate).toHaveBeenCalledWith(SCREENS.COACH_TABS, {
      screen: SCREENS.MARSHAL,
    });
  });
});
