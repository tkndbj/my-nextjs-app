// src/app/layout.js

import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import Header from "./components/Header";
import LayoutContent from "./components/LayoutContent";
import "../app/components/Sidebar.module.css";
import { SidebarProvider } from "../../context/SidebarContext";
import Sidebar from "./components/Sidebar"; // Import Sidebar
import { MarketProvider } from "../../context/MarketContext"; // Import MarketProvider

export const metadata = {
  title: "My Web App",
  description: "A description of my web app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Existing Links */}
        {/* Font Awesome 6 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          integrity="sha512-rq1oxIogk9CjJdxwJk0zTRuEtDBX8Gqp4M8hYl1BeL+ukPLA81CK0yINqz7W6hvLj8Xr2NKhxTJtc0ZAjliCaA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Google Fonts (Figtree) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap"
        />
        {/* Boxicons CSS */}
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders>
          <SidebarProvider>
            <MarketProvider>
              {/* Main wrapper: Sidebar + Content */}
              <div className="flex">
                {/* SIDEBAR: hidden on screens < md, visible on md and above */}
                <div className="hidden md:block">
                  <Sidebar />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  <LayoutContent>{children}</LayoutContent>
                </div>
              </div>
            </MarketProvider>
          </SidebarProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
