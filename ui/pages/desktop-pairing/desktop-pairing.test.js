import React from 'react';
import reactRouterDom from 'react-router-dom';
import { waitFor, act, screen } from '@testing-library/react';
import actions from '../../store/actions';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest';
import mockState from '../../../test/data/mock-state.json';
import { SECOND } from '../../../shared/constants/time';
import DesktopPairingPage from '.';

const mockHideLoadingIndication = jest.fn();
const mockShowLoadingIndication = jest.fn();

jest.mock('../../store/actions', () => {
  return {
    hideLoadingIndication: () => mockHideLoadingIndication,
    showLoadingIndication: () => mockShowLoadingIndication,
    generateDesktopOtp: jest.fn(),
  };
});

const mockedActions = actions;

describe('Desktop Pairing page', () => {
  const mockHistoryPush = jest.fn();

  function flushPromises() {
    // Wait for promises running in the non-async timer callback to complete.
    // From https://github.com/facebook/jest/issues/2157#issuecomment-897935688
    return new Promise(jest.requireActual('timers').setImmediate);
  }

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: mockHistoryPush });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('should render otp component', async () => {
    const otp = '123456';
    mockedActions.generateDesktopOtp.mockResolvedValue(otp);

    const store = configureStore(mockState);
    let container = null;

    act(() => {
      container = renderWithProvider(<DesktopPairingPage />, store).container;
    });

    await waitFor(() => {
      expect(screen.getByTestId('desktop-pairing-otp-content')).toBeDefined();
    });

    expect(container).toMatchSnapshot();
  });

  it('should re-render otp component after 30s', async () => {
    jest.useFakeTimers();
    const otp = '123456';
    const newOtp = '654321';
    const neverGeneratedOTP = '111222';
    mockedActions.generateDesktopOtp
      .mockResolvedValueOnce(otp)
      .mockResolvedValueOnce(newOtp)
      .mockResolvedValueOnce(neverGeneratedOTP);

    const store = configureStore(mockState);

    act(() => {
      renderWithProvider(<DesktopPairingPage />, store);
    });

    // First render
    await waitFor(async () => {
      await flushPromises();
      expect(screen.getByTestId('desktop-pairing-otp-content')).toBeDefined();
      expect(screen.getByText(otp)).toBeDefined();
      expect(mockedActions.generateDesktopOtp).toHaveBeenCalledTimes(1);
    });

    // Advance timers 30s to trigger next OTP
    act(() => jest.advanceTimersByTime(30 * SECOND));

    await waitFor(async () => {
      await flushPromises();
      expect(screen.getByTestId('desktop-pairing-otp-content')).toBeDefined();
      expect(screen.getByText(newOtp)).toBeDefined();
      expect(mockedActions.generateDesktopOtp).toHaveBeenCalledTimes(2);
    });

    // Advance timers 10s to test that OTP is still the same
    act(() => jest.advanceTimersByTime(10 * SECOND));

    await waitFor(async () => {
      await flushPromises();
      expect(screen.getByTestId('desktop-pairing-otp-content')).toBeDefined();
      expect(screen.getByText(newOtp)).toBeDefined();
      expect(mockedActions.generateDesktopOtp).toHaveBeenCalledTimes(2);
    });

    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
