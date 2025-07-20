
import React from 'react';
import Header from './header';
import Footer from './footer';
import { BottomNavigation } from './bottom-navigation';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* The container was missing here, this fixes the layout for all pages */}
        <div className="container mx-auto px-4 py-8">
            {children}
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
