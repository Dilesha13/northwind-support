
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ticketsApi } from '../../../api/tickets';
import { page, ticketListItem } from '../../../test/fixtures';
import { useTicketList } from './useTicketList';

vi.mock('../../../api/tickets', () => ({
  ticketsApi: {
    getTickets: vi.fn(),
  },
}));

const getTickets = vi.mocked(ticketsApi.getTickets);

describe('useTicketList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getTickets.mockResolvedValue(page([ticketListItem()]));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('requests tickets immediately when the status changes', async () => {
    const { result } = renderHook(() => useTicketList());

    await act(async () => {
      await Promise.resolve();
    });

    expect(getTickets).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.updateFilters({ status: 'InProgress' });
      await Promise.resolve();
    });

    expect(getTickets).toHaveBeenCalledTimes(2);
    expect(getTickets).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'InProgress',
        page: 1,
      }),
    );
  });

  it('debounces search and sends the settled text', async () => {
    const { result } = renderHook(() => useTicketList());

    await act(async () => {
      await Promise.resolve();
    });

    expect(getTickets).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.updateFilters({ search: 'inv' });
    });

    act(() => {
      result.current.updateFilters({ search: 'invoice' });
    });

    expect(getTickets).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(getTickets).toHaveBeenCalledTimes(2);
    expect(getTickets).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'invoice',
        page: 1,
      }),
    );
  });
});
