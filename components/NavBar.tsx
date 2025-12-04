
import React from 'react';
import { Home, Book, BookOpen, Scroll, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide NavBar on specific routes (e.g. Input Screen to allow full keyboard)
  if (location.pathname === '/input') return null;

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-1 min-w-[50px] transition-colors ${
        isActive(path) 
          ? 'text-santri-green dark:text-santri-gold' 
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <Icon size={24} strokeWidth={isActive(path) ? 3 : 2.5} />
      <span className={`text-[10px] ${isActive(path) ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );

  
};

export default NavBar;
