// src/components/LayoutContent.jsx

"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({ children }) {
  const pathname = usePathname();

  // Define excluded paths
  const isExcludedPath = pathname === "/login";

  const hasHeader = !isExcludedPath;

  return <main className={`${hasHeader ? "pt-14" : "pt-0"}`}>{children}</main>;
}
