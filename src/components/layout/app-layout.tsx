import type React from 'react';
import Header from './header';
import Footer from './footer';
import BottomNavigation from './bottom-navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
