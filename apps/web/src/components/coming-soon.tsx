export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
