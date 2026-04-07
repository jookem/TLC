export function PageError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <p className="text-4xl">⚠️</p>
      <p className="text-gray-700 font-medium">Something went wrong</p>
      <p className="text-sm text-gray-400">{message ?? 'Could not load data. Check your connection.'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
