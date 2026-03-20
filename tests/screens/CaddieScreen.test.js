import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import CaddieScreen from '../../src/screens/Caddie/CaddieScreen';
import useCaddie from '../../src/hooks/useCaddie';
import useAuth from '../../src/hooks/useAuth';
import { navigate } from '../../src/helpers/navigation.helper';
import { ROLES } from '../../src/constants/auth.constants';
import { SCREENS } from '../../src/constants/navigation.constants';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('../../src/hooks/useCaddie', () => jest.fn());
jest.mock('../../src/hooks/useAuth', () => jest.fn());
jest.mock('../../src/helpers/navigation.helper', () => ({
  navigate: jest.fn(),
}));

const mockUseCaddie = useCaddie;
const mockUseAuth = useAuth;

const buildCaddieState = () => ({
  error: null,
  input: '',
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
  resetConversation: jest.fn(),
  selectSuggestion: jest.fn(),
  sendCurrentMessage: jest.fn(),
  setInput: jest.fn(),
  suggestions: [],
});

describe('CaddieScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseCaddie.mockReturnValue(buildCaddieState());
  });

  test('shows a Marshal handoff action for dual-role staff-capable users and switches role before navigation', async () => {
    jest.useFakeTimers();
    const switchRole = jest.fn().mockResolvedValue(undefined);

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

    await act(async () => {
      jest.advanceTimersByTime(60);
    });

    expect(navigate).toHaveBeenCalledWith(SCREENS.COACH_TABS, {
      screen: SCREENS.MARSHAL,
      params: {
        marshalIntent: expect.objectContaining({
          message: expect.stringContaining('Reason: booking_support'),
          handoff: expect.objectContaining({
            target: 'marshal',
          }),
        }),
      },
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
});
