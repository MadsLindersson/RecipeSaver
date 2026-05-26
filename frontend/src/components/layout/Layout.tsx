import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { UsernameModal } from '../ui/UsernameModal';
import { CalculatorSidebar } from '../ui/CalculatorSidebar';

export const Layout: React.FC = () => {
  const { needsUsername } = useAuth();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenCalculator={() => setIsCalculatorOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <CalculatorSidebar 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />
      {needsUsername && <UsernameModal />}
    </div>
  );
};
