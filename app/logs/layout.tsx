"use client";

import { NavBar } from "@/components/Navbar";

export default function LogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}


