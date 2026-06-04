'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSpecialPortal = pathname?.startsWith('/admin') || pathname?.startsWith('/reporter') || pathname?.startsWith('/affiliates');

  if (isSpecialPortal) {
    return <main className="flex-grow bg-[#F5F7FA] text-[#1a1a1a] min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
