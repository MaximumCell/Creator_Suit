export default function YoutubePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">YouTube Stats</h1>
      <p className="text-sm text-muted mt-1">
        Track subscriber counts, views, and growth across channels.
      </p>

      <div className="mt-8 bg-card border rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">🚧</div>
        <h2 className="text-lg font-medium">Coming soon</h2>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">
          This tab is part of the next build. The database tables are already
          in place — we&apos;ll wire up the YouTube Data API and channel cards
          in the next pass.
        </p>
      </div>
    </div>
  );
}
