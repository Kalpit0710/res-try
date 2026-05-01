export function PlaceholderPage(props: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">{props.title}</h2>
      <p className="text-sm text-black/60 mt-1">UI coming next.</p>
    </div>
  );
}
