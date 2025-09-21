// Using anchor tags to avoid dependency on next/link types in this scaffold

export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">MTA ACE Insight Dashboard</h1>
          <p className="text-sm sm:text-base text-foreground/70 mt-2">Answer the datathon business questions with curated metrics, AI copilots, and spatial intelligence.</p>
          <div className="mt-4 grid gap-2 text-xs sm:text-sm text-foreground/60">
            <div>- Identify high-utilization CUNY corridors and compare ACE vs non-ACE performance.</div>
            <div>- Surface exempt repeaters and map hotspot clusters for field intervention.</div>
            <div>- Track CBD policy impacts alongside congestion pricing and prepare predictive scenarios.</div>
          </div>
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
