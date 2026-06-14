'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { cn, getInitials } from '@/lib/utils';
import { LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  title?: string;
  children?: React.ReactNode;
}

export function TopBar({ title = 'Dashboard', children }: TopBarProps) {
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-6 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Center: Period selector or custom children */}
      <div className="flex-1 flex items-center justify-end px-4">
        {children}
      </div>

      {/* Right: Theme toggle + User menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Toggle theme"
        >
          {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-hover transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user ? getInitials(user.email) : '??'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-lg animate-scale-in z-50">
              <div className="p-2 border-b border-border">
                <div className="text-xs font-medium text-foreground truncate px-2">
                  {user?.email}
                </div>
                <div className="text-[11px] text-muted-foreground px-2">{user?.role}</div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
