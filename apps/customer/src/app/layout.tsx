import React from 'react';

export const metadata = {
  title: 'Somnob Retail - Customer Store',
  description: 'Order online for pickup or direct delivery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f1f5f9', color: '#1e293b' }}>
        {children}
      </body>
    </html>
  );
}
