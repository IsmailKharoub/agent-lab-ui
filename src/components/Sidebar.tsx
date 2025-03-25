import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { id: '/', icon: 'grid', label: 'Dashboard' },
    { id: '/agents', icon: 'robot', label: 'My Agents' },
    { id: '/create', icon: 'plus-circle', label: 'New Agent' },
    { id: '/templates', icon: 'bookmark', label: 'Templates' },
    { id: '/history', icon: 'clock-history', label: 'History' },
  ];
  
  // Helper function to check if a path is active (handles both exact matches and sub-paths)
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };
  
  return (
    <div className="bg-slate-900 text-slate-300 w-56 flex-shrink-0 h-full">
      <div className="py-4">
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.id}
            className={({ isActive: active }) => 
              `w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-800 transition-colors ${
                isActive(item.id) ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-400' : ''
              }`
            }
          >
            <i className={`bi bi-${item.icon} ${isActive(item.id) ? 'text-blue-400' : ''}`}></i>
            <span>{item.label}</span>
            {item.id === '/agents' && (
              <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full">4</span>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="border-t border-slate-700 pt-4 mt-4 px-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2">Recent Agents</h3>
        {['GitHub Repo Research', 'LinkedIn Profile Analysis', 'News Summary'].map((agent, index) => (
          <div key={index} className="px-2 py-2 hover:bg-slate-800 rounded text-sm mb-1 cursor-pointer">
            <div className="flex items-center space-x-2">
              <i className="bi bi-robot text-slate-400"></i>
              <span className="truncate">{agent}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 