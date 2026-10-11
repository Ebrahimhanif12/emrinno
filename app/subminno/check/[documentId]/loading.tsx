export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="subminno-container flex h-16 items-center">
          <div className="h-6 w-32 animate-pulse rounded bg-surface-soft" />
        </div>
      </header>

      <div className="subminno-container py-8 sm:py-10">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-soft" />

        <div className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="size-12 animate-pulse rounded-lg bg-surface-soft" />

            <div className="flex-1">
              <div className="h-5 max-w-md animate-pulse rounded bg-surface-soft" />
              <div className="mt-3 h-4 w-56 animate-pulse rounded bg-surface-soft" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="mx-auto h-8 w-96 max-w-full animate-pulse rounded bg-surface-soft" />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="h-[420px] animate-pulse rounded-xl border border-border bg-surface" />
            <div className="h-[420px] animate-pulse rounded-xl border border-border bg-surface" />
          </div>
        </div>
      </div>
    </main>
  );
}