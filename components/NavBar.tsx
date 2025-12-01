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
      <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-300">
      <NavItem path="/" icon={Home} label="Beranda" />
      <NavItem path="/kitab" icon={Book} label="Kitab" />
      <NavItem path="/quran" icon={BookOpen} label="Al-Quran" />
      <NavItem path="/hadis" icon={Scroll} label="Hadis" />
      <NavItem path="/settings" icon={Settings} label="Akun" />
    </nav>
  );
};

export default NavBar;