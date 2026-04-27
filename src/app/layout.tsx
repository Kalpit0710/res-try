import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Result Management System",
  description: "Web app for student records, marks entry, and report card generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/*
         * Inline script to prevent flash of wrong theme (FOUC).
         * dangerouslySetInnerHTML is safe here: the content is a hardcoded
         * string literal with no user input — it only reads from localStorage
         * and sets an HTML attribute on the root element.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
