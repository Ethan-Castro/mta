export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="hidden sm:block border-r border-foreground/10 p-6">
        <div className="text-sm font-semibold mb-6 tracking-tight">ACE Dashboard</div>
        <nav className="space-y-2">
          <a href="/executive" className="block text-sm text-foreground/80 hover:text-foreground">Executive</a>
          <a href="/operations" className="block text-sm text-foreground/80 hover:text-foreground">Operations</a>
          <a href="/policy" className="block text-sm text-foreground/80 hover:text-foreground">Policy</a>
          <a href="/data-science" className="block text-sm text-foreground/80 hover:text-foreground">Data Science</a>
        </nav>
      </aside>
      <section className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-foreground/60">MTA ACE Insight Dashboard</div>
          <a href="/executive" className="text-sm text-foreground/80 hover:text-foreground">Insights</a>
        </div>
        {children}
      </section>
    </div>
  );
}


