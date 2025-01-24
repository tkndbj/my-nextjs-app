// src/app/components/HeaderWrapper.js

"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Define paths where Header should not be displayed
  const excludedPaths = ["/login"];

  // Check if the current path is excluded
  const shouldExcludeHeader = excludedPaths.includes(pathname);

  if (shouldExcludeHeader) {
    return null;
  }

  return <Header />;
}
