// src/app/layout.js

import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import HeaderWrapper from "./components/HeaderWrapper"; // Import HeaderWrapper
import LayoutContent from "./components/LayoutContent";
import "../app/components/Sidebar.module.css";
import { SidebarProvider } from "../../context/SidebarContext";
import Sidebar from "./components/Sidebar";
import { MarketProvider } from "../../context/MarketContext";

export const metadata = {
  title: "My Web App",
  description: "A description of my web app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-figtree">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />

        {/* 1) Link to the Figtree font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <ClientProviders>
          <SidebarProvider>
            <MarketProvider>
              <div className="flex">
                {/* Sidebar always visible (remove 'hidden md:block' if you want) */}
                <Sidebar />

                {/* Main content */}
                <div className="flex-1 flex flex-col">
                  {/* Include HeaderWrapper here */}
                  <HeaderWrapper />

                  {/* LayoutContent wraps the page's children */}
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
