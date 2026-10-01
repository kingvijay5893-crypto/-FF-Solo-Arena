export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-arena-muted">
      <div className="h-8 w-8 rounded-full border-2 border-arena-border border-t-arena-orange animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
