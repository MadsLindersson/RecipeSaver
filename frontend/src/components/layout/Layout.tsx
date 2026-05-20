import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { UsernameModal } from '../ui/UsernameModal';

export const Layout: React.FC = () => {
  const { needsUsername } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      {needsUsername && <UsernameModal />}
    </div>
  );
};
