export default function Header({ title }: { title: string }) {
  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 shrink-0">
      <h1 className="font-semibold text-sm">{title}</h1>
    </header>
  );
}
