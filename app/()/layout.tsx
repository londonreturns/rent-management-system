"use client";
import { NavBar } from "@/components/Navbar";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
      <footer className="border-t mt-6">
        <div className="mx-auto max-w-6xl p-4 flex items-center justify-between text-sm text-gray-600">
          <div>© {new Date().getFullYear()} Rent Management</div>
          <Link href="/logs" className="px-3 py-1 rounded border transition-colors hover:bg-black hover:text-white">Show Logs</Link>
        </div>
      </footer>
    </>
  );
}
