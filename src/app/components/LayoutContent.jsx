// src/components/LayoutContent.jsx

"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({ children }) {
  const pathname = usePathname();

  // Define excluded paths
  const isExcludedPath =
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/Subscription" ||
    pathname.startsWith("/profile/") || // Exclude profile pages
    pathname.startsWith("/products/") || // Exclude product detail pages
    pathname.startsWith("/myproducts/") ||
    pathname.startsWith("/editproduct/") ||
    pathname.startsWith("/propertydetail/") ||
    pathname.startsWith("/userprofile/") ||
    pathname.startsWith("/soldproduct/") ||
    pathname.startsWith("/productpayment/") ||
    pathname.startsWith("/listproperty") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/ads") ||
    pathname.startsWith("/listproduct"); // Exclude list product page

  const hasHeader = !isExcludedPath;

  return <main className={`${hasHeader ? "pt-16" : "pt-0"}`}>{children}</main>;
}
