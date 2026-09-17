import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BagPack — Budget-First Group Trip Planning',
  description:
    'Tell us your budget. We tell you where in the world you can realistically go. AI-powered trip planning with transparent cost breakdowns for groups.',
  keywords:
    'trip planning, group travel, budget travel, travel planner, AI travel, India travel, international trips',
  authors: [{ name: 'BagPack' }],
  openGraph: {
    title: 'BagPack',
    description: 'Budget-first group trip planning. Know where you can go before you book.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0A] text-[#F5E6D3] antialiased flex flex-col min-h-screen overflow-x-hidden w-full items-center">
        <Navbar />
        <div className="flex-1 w-full flex flex-col items-center">{children}</div>
      </body>
    </html>
  );
}
