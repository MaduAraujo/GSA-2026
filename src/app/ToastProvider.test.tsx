import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast, type ToastOptions } from './ToastProvider';

const api: { show?: (options: ToastOptions) => string } = {};
const show = (options: ToastOptions) => api.show!(options);

function Capture() {
  const toast = useToast();
  useEffect(() => {
    api.show = toast.show;
  }, [toast]);
  return null;
}

const renderProvider = () =>
  render(
    <ToastProvider>
      <Capture />
    </ToastProvider>,
  );

describe('ToastProvider', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('closes itself after the duration and reports why', () => {
    const onClose = vi.fn();
    renderProvider();
    act(() => void show({ message: 'Salvo', onClose }));
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledExactlyOnceWith('timeout');
  });

  it('pauses the timer while hovered', () => {
    renderProvider();
    act(() => void show({ message: 'Salvo', duration: 1000 }));
    fireEvent.mouseEnter(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('runs the action and closes with reason "action"', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    renderProvider();
    act(() => void show({ message: 'Excluído', action: { label: 'Desfazer', onClick }, onClose }));
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledExactlyOnceWith('action');
  });

  it('announces errors as alerts', () => {
    renderProvider();
    act(() => void show({ message: 'Falhou', tone: 'error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });

  it('keeps at most three toasts, closing the oldest first', () => {
    const onFirstClose = vi.fn();
    renderProvider();
    act(() => {
      show({ message: 'Um', onClose: onFirstClose });
      show({ message: 'Dois' });
      show({ message: 'Três' });
      show({ message: 'Quatro' });
    });
    expect(screen.getAllByRole('status').map((t) => t.textContent)).toEqual(['Dois', 'Três', 'Quatro']);
    expect(onFirstClose).toHaveBeenCalledExactlyOnceWith('timeout');
  });
});
