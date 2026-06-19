'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { cn, getInitials } from '@/lib/utils';
import {
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Command,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopBarProps {
  title?: string;
  children?: React.ReactNode;
}

export function TopBar({ title = 'Dashboard', children }: TopBarProps) {
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-6 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
      {/* Left: Title */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Center: Period selector or custom children */}
      <div className="flex-1 flex items-center justify-end px-4">
        {children}
      </div>

      {/* Right: Search + Theme toggle + User menu */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={toggleTheme}
        >
          {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {user ? getInitials(user.email) : '??'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
