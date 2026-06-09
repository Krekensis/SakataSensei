import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  color?: string;
}

const Navbar: React.FC<NavbarProps> = ({ color = "#60a5fa" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="bg-transparent backdrop-blur-xl fixed top-0 left-0 right-0 z-50"
      style={{ '--hover-color': color } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-16 py-4 flex items-center justify-between">
        <Link to="/" className="flex flex-row items-start">
          <img src="/gintoki-icon2.png" alt="Sakata Sensei Logo" className="w-8 h-8 sm:w-10 sm:h-10 mr-2" />
          <div className="text-blue-100 font-newtegomin text-3xl sm:text-4xl font-bold">
            Sakata Sensei
          </div>
        </Link>

        {/* desktop */}
        <div className="hidden md:flex items-center gap-6 text-white font-medium">
          <Link to="/" className="hover:text-(--hover-color) transition-colors duration-300">Home</Link>
          <Link to="/recommend/by-list" className="hover:text-(--hover-color) transition-colors duration-300">Your List</Link>
          <Link to="/recommend/by-anime" className="hover:text-(--hover-color) transition-colors duration-300">Similar</Link>
          <Link to="/recommend/by-chat" className="hover:text-(--hover-color) transition-colors duration-300">AI Chat</Link>
        </div>

        {/* mobile */}
        <button
          className="md:hidden text-white"
          aria-label="Toggle navigation menu"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 text-white font-medium space-y-2 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          <Link to="/" onClick={() => setIsOpen(false)} className="block hover:text-(--hover-color) transition-colors duration-300">Home</Link>
          <Link to="/recommend/by-list" onClick={() => setIsOpen(false)} className="block hover:text-(--hover-color) transition-colors duration-300">Your List</Link>
          <Link to="/recommend/by-anime" onClick={() => setIsOpen(false)} className="block hover:text-(--hover-color) transition-colors duration-300">Similar</Link>
          <Link to="/recommend/by-chat" onClick={() => setIsOpen(false)} className="block hover:text-(--hover-color) transition-colors duration-300">AI Chat</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
