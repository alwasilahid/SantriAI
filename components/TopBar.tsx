import React from 'react';
import { BookOpen } from 'lucide-react';

const TopBar: React.FC<{ title?: string }> = ({ title = "SantriAI" }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-santri-green dark:bg-santri-green-dark text-white px-4 py-4 flex items-center gap-3 shadow-md z-50 transition-colors duration-300 border-b border-santri-gold/30">
      <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm border border-santri-gold/50">
        <BookOpen size={20} className="text-santri-gold" />
      </div>
      <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
    </header>
  );
};

export default TopBar;