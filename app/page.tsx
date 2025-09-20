// Using anchor tags to avoid dependency on next/link types in this scaffold

export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">MTA ACE Insight Dashboard</h1>
          <p className="text-sm sm:text-base text-foreground/70 mt-2">Beautiful, minimal, and clear views for stakeholders.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/executive" className="block rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 transition-colors">
            <h2 className="font-medium">Executive</h2>
            <p className="text-sm text-foreground/70 mt-1">KPIs and narrative insights</p>
          </a>
          <a href="/operations" className="block rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 transition-colors">
            <h2 className="font-medium">Operations</h2>
            <p className="text-sm text-foreground/70 mt-1">Route speeds and violations</p>
          </a>
          <a href="/policy" className="block rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 transition-colors">
            <h2 className="font-medium">Policy</h2>
            <p className="text-sm text-foreground/70 mt-1">CBD & ACE impact</p>
          </a>
          <a href="/data-science" className="block rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 transition-colors">
            <h2 className="font-medium">Data Science</h2>
            <p className="text-sm text-foreground/70 mt-1">Predictions & simulations</p>
          </a>
        </div>
      </div>
    </main>
  );
}
