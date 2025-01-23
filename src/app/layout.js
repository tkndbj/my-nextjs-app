// src/app/layout.js

import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import Header from "./components/Header";
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
    <html lang="en">
      <head>
        {/* Existing <link> tags */}
      </head>
      <body>
        <ClientProviders>
          <SidebarProvider>
            <MarketProvider>
              <div className="flex">
                {/* Removed `hidden md:block` to allow mobile display. */}
                <Sidebar />

                {/* Main content */}
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
