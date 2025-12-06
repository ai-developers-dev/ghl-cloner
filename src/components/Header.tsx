'use client';

import { useState } from 'react';
import Link from 'next/link';

const solutions = [
  { name: 'Page Cloner', href: '/cloner', available: true, icon: '📋' },
  { name: 'Contact Buttons', href: '#', available: false, icon: '📞' },
  { name: 'Google Maps', href: '#', available: false, icon: '🗺️' },
  { name: 'Zillow Links', href: '#', available: false, icon: '🏠' },
  { name: 'Dialer', href: '#', available: false, icon: '📱' },
];

export default function Header() {
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
            HE
          </div>
          <span className="font-bold text-lg text-white">HLExtras</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
              onBlur={() => setTimeout(() => setIsSolutionsOpen(false), 150)}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors py-2"
            >
              Solutions
              <svg
                className={`w-4 h-4 transition-transform ${isSolutionsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isSolutionsOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
                {solutions.map((item) => (
                  <Link
                    key={item.name}
                    href={item.available ? item.href : '#'}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      item.available
                        ? 'hover:bg-slate-800 text-white'
                        : 'text-slate-500 cursor-not-allowed'
                    }`}
                    onClick={(e) => !item.available && e.preventDefault()}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {!item.available && (
                        <div className="text-xs text-slate-600">Coming Soon</div>
                      )}
                    </div>
                    {item.available && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                        Live
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Get Started Button */}
          <Link
            href="/cloner"
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-sm text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-shadow"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950">
          <div className="px-4 py-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Solutions
            </div>
            {solutions.map((item) => (
              <Link
                key={item.name}
                href={item.available ? item.href : '#'}
                onClick={(e) => {
                  if (!item.available) e.preventDefault();
                  else setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  item.available
                    ? 'hover:bg-slate-900 text-white'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.available ? (
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                    Live
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">Soon</span>
                )}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/cloner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
