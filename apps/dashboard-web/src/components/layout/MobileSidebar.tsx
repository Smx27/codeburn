'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { cn, getInitials } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Flame,
  LayoutDashboard,
  Activity,
  Cpu,
  Box,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Sun,
  Moon,
  Key,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Sessions', href: '/sessions', icon: Activity },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Providers', href: '/providers', icon: Cpu },
      { label: 'Models', href: '/models', icon: Box },
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Trends', href: '/trends', icon: TrendingUp },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'API Keys', href: '/settings/api-keys', icon: Key },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => onOpenChange(false)}>
              <Flame className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
                AIInsight
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                        )}
                        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="shrink-0 border-t border-sidebar-border p-2 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors w-full"
            >
              {resolved === 'dark' ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
              <span>{resolved === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            {user && (
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {getInitials(user.email)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{user.email}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user.role}</div>
                </div>
                <button
                  onClick={() => { logout(); onOpenChange(false); }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-hover transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
