export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`.trim()} />
  );
}

export function TableLoadingSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t">
          {Array.from({ length: cols }).map((__, cellIndex) => (
            <td key={cellIndex} className="p-2">
              <LoadingSkeleton className="h-6 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
