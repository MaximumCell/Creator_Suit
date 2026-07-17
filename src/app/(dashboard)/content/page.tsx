export default function ContentPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Content Pipeline</h1>
      <p className="text-sm text-muted mt-1">
        Kanban board for ideas → final → shooting → posted.
      </p>

      <div className="mt-8 bg-card border rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">🚧</div>
        <h2 className="text-lg font-medium">Coming soon</h2>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">
          This tab is part of the next build. The content_ideas table is
          already in place — we&apos;ll add the board, card creation, and
          drag-and-drop in the next pass.
        </p>
      </div>
    </div>
  );
}
