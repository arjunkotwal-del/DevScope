import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Code2, Moon, Sun, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-800 bg-[#09090B]/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-[#09090B]/60">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">DevScope</span>
        </div>
        
        <div className="flex-1 flex gap-2 ml-8">
          <Button
            variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/dashboard')}
            className={location.pathname === '/dashboard' ? 'bg-indigo-600' : 'text-zinc-400'}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={location.pathname === '/settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/settings')}
            className={location.pathname === '/settings' ? 'bg-indigo-600' : 'text-zinc-400'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-zinc-400 hover:text-white"
            data-testid="theme-toggle-button"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <div className="h-8 w-px bg-zinc-800" />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-zinc-400 hover:text-red-400"
              data-testid="logout-button"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
