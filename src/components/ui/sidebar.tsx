'use client';

import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

interface SidebarProps {
  leftSidebarOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ leftSidebarOpen, closeSidebar }: SidebarProps) => {
  return (
    <>
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-stone-900 border-r border-stone-700 transform transition-transform duration-300 ease-in-out z-50 ${
          leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-700">
            <h2 className="text-white text-lg font-semibold">SuperAI</h2>
            <button
              onClick={closeSidebar}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History only */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-stone-800 text-white">
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat History</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-stone-700">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
