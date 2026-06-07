"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/github", label: "GitHub" },
  { href: "/reports", label: "Reports" },
  { href: "/resume", label: "Resume" },
  { href: "/workflow", label: "Workflow" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-52 shrink-0 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 font-bold text-lg tracking-tight">OXE</div>
      <nav className="flex flex-col gap-0.5 px-2">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === href
                ? "bg-zinc-100 dark:bg-zinc-800 font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
