'use client';

import { useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/utils';
import {
  LogOut,
  ChevronDown,
  Search,
  Menu,
} from 'lucide-react';
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
  onMobileMenuToggle?: () => void;
}

export function TopBar({ title = 'Dashboard', children, onMobileMenuToggle }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 md:px-6 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl shrink-0">
      {/* Left: Mobile menu + Title */}
      <div className="flex items-center gap-2 min-w-0">
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-sm font-semibold text-white truncate font-sora">{title}</h1>
      </div>

      {/* Center: Period selector or custom children */}
      <div className="flex-1 flex items-center justify-end px-4">
        {children}
      </div>

      {/* Right: Search + User menu */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2 text-white/60 hover:text-white hover:bg-white/[0.04]">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 border border-primary/20 text-xs font-semibold text-primary">
                  {user ? getInitials(user.email) : '??'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-white/30 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/[0.08]">
            <div className="p-2">
              <p className="text-sm font-medium text-white/80">{user?.email}</p>
              <p className="text-xs text-white/40">{user?.role}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem onClick={logout} className="text-white/60 hover:text-white hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
