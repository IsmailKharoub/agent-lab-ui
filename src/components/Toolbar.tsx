import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

interface ToolbarProps {
  isApiConnected: boolean;
  isWebSocketConnected?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ isApiConnected, isWebSocketConnected = false }) => {
  const location = useLocation();
  const params = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generate breadcrumbs based on current location
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return [{ label: 'Dashboard', path: '/' }];
    }
    
    const breadcrumbs = [{ label: 'Dashboard', path: '/' }];
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Format the breadcrumb label (capitalize, replace hyphens with spaces)
      let label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      
      // Special case for agent details
      if (part === 'agents' && pathParts[index + 1]) {
        breadcrumbs.push({ label: 'My Agents', path: '/agents' });
        if (pathParts[index + 1]) {
          breadcrumbs.push({ 
            label: `Agent ${pathParts[index + 1].substring(0, 8)}...`, 
            path: currentPath + `/${pathParts[index + 1]}` 
          });
        }
        return;
      }
      
      breadcrumbs.push({ label, path: currentPath });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  // Check active section for highlighting menu items
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="flex flex-col">
      {/* Main Toolbar */}
      <div className="bg-slate-800 text-white flex items-center justify-between px-4 py-2 h-12">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-1 mr-8">
            <i className="bi bi-robot text-blue-400"></i>
            <span className="font-semibold">Brainess Agents Lab</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Link 
              to="/" 
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${isActive('/') && !location.pathname.startsWith('/agents') && !location.pathname.startsWith('/create') && !location.pathname.startsWith('/settings') ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
            >
              <i className="bi bi-house-door"></i>
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <Link 
              to="/agents" 
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${isActive('/agents') ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
            >
              <i className="bi bi-robot"></i>
              <span className="hidden md:inline">Agents</span>
            </Link>
            <Link 
              to="/create" 
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${isActive('/create') ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
            >
              <i className="bi bi-plus-circle"></i>
              <span className="hidden md:inline">New Agent</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full flex items-center text-xs ${isApiConnected ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
            {isApiConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
                <span className="hidden sm:inline">API Connected</span>
                <span className="sm:hidden">API</span>
              </>
            ) : (
              <>
                <i className="bi bi-exclamation-triangle-fill mr-2"></i> 
                <span className="hidden sm:inline">API Disconnected</span>
                <span className="sm:hidden">API</span>
              </>
            )}
          </div>
          
          {isApiConnected && (
            <div className={`px-3 py-1 rounded-full flex items-center text-xs ${isWebSocketConnected ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}`}>
              {isWebSocketConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                  <span className="hidden sm:inline">Real-time</span>
                  <span className="sm:hidden">RT</span>
                </>
              ) : (
                <>
                  <i className="bi bi-wifi-off mr-2"></i>
                  <span className="hidden sm:inline">Polling</span>
                  <span className="sm:hidden">P</span>
                </>
              )}
            </div>
          )}
          
          {/* Settings dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`hover:bg-slate-700 p-2 rounded transition-colors flex items-center space-x-1 ${isActive('/settings') ? 'bg-slate-700' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="bi bi-gear"></i>
              <span className="hidden md:inline">Settings</span>
              <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} text-xs`}></i>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                <Link 
                  to="/settings" 
                  className="flex items-center px-4 py-2 text-sm hover:bg-slate-700 rounded-t-lg"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-key mr-2"></i>
                  API Settings
                </Link>
                <Link 
                  to="/settings" 
                  className="flex items-center px-4 py-2 text-sm hover:bg-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-palette mr-2"></i>
                  Appearance
                </Link>
                <Link 
                  to="/settings" 
                  className="flex items-center px-4 py-2 text-sm hover:bg-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-browser-chrome mr-2"></i>
                  Browser Settings
                </Link>
                <div className="border-t border-slate-700 my-1"></div>
                <a 
                  href="https://github.com/ismail-kharoub" 
                  target="_blank"
                  className="flex items-center px-4 py-2 text-sm hover:bg-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-github mr-2"></i>
                  GitHub
                </a>
                <a 
                  href="#" 
                  className="flex items-center px-4 py-2 text-sm hover:bg-slate-700 rounded-b-lg"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-question-circle mr-2"></i>
                  Help
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center text-sm">
        <div className="flex items-center">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <i className="bi bi-chevron-right text-slate-400 mx-2"></i>}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-slate-800">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-slate-600 hover:text-blue-600 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 