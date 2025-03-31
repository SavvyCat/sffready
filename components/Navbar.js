"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-zinc-800 shadow-md sticky top-0 z-50 px-4 py-3 border-b border-zinc-700">
      <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          <Link href="/">SFF Ready?</Link>
        </h1>
        <nav className="flex space-x-4">
          <Link
            href="/"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Case Finder
          </Link>
          <Link
            href="/build"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === "/build"
                ? "bg-blue-600 text-white"
                : "text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            PC Builder
          </Link>
        </nav>
      </div>
    </header>
  );
}
