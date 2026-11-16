import { useState } from 'react';
import { useToast } from '../app/ToastProvider';

interface UndoableDeleteOptions<T> {
  commit: (item: T) => Promise<void>;
  message: string;
  errorMessage: string;
}

export function useUndoableDelete<T extends { id: string }>({
  commit,
  message,
  errorMessage,
}: UndoableDeleteOptions<T>) {
  const toast = useToast();
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());

  const setPending = (id: string, isPending: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });

  const remove = (item: T) => {
    setPending(item.id, true);
    toast.show({
      message,
      action: { label: 'Desfazer', onClick: () => {} },
      onClose: async (reason) => {
        if (reason === 'action') {
          setPending(item.id, false);
          return;
        }
        try {
          await commit(item);
        } catch (err) {
          console.error(err);
          toast.show({ message: errorMessage, tone: 'error' });
        } finally {
          setPending(item.id, false);
        }
      },
    });
  };

  return { pendingIds, remove };
}
