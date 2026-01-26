'use client';

import Link from 'next/link';
import { Home, Activity, Calendar } from 'lucide-react';
import type { ReactNode } from 'react';

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  activePage: 'tracking' | 'planner';
};

const AppHeader = ({ title, subtitle, icon, activePage }: AppHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Home size={20} />
            </Link>
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <Link
              href="/tracking"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                activePage === 'tracking'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity size={18} />
              <span className="hidden sm:inline">Load Tracking</span>
            </Link>
            <Link
              href="/planner"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                activePage === 'planner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Session Planner</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
