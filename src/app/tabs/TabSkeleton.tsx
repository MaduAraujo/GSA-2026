export function TabSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="h-64 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse"
    />
  );
}
