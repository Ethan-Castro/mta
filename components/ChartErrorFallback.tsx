interface ChartErrorFallbackProps {
  error?: Error;
}

export default function ChartErrorFallback({ error }: ChartErrorFallbackProps) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-md border border-destructive/20 bg-destructive/5">
      <div className="text-center">
        <p className="text-destructive text-sm font-medium">Chart failed to render</p>
        <p className="text-destructive/70 text-xs mt-1">
          {error?.message || "Unable to display chart"}
        </p>
      </div>
    </div>
  );
}
