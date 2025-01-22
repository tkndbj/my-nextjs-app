// src/app/layout.js
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import LayoutContent from "./components/LayoutContent";
import "../app/components/Sidebar.module.css";
import { SidebarProvider } from "../../context/SidebarContext";
import Sidebar from "./components/Sidebar";
import { MarketProvider } from "../../context/MarketContext";

export const metadata = {
  title: "My Web App",
  description: "A description of my web app.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
      <body className="overflow-x-hidden">
        <ClientProviders>
          <SidebarProvider>
            <MarketProvider>
              <div className="flex">
                {/* Sidebar – it is fixed via CSS */}
                <Sidebar />
                {/* Main Content Area: add a left margin to ensure content does not slip under the Sidebar */}
                <div className="flex-1 flex flex-col ml-[200px] sm:ml-[200px] md:ml-[200px] lg:ml-[200px] xl:ml-[200px]">
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
