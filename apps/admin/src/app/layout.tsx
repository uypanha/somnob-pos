import React from 'react';

export const metadata = {
  title: 'Somnob Admin Dashboard',
  description: 'Enterprise Multi-Branch Retail Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
