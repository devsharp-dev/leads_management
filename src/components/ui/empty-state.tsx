export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500"
      role="status"
    >
      {message}
    </div>
  )
}
