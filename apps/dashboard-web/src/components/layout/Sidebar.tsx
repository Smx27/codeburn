'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { cn, getInitials } from '@/lib/utils';
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
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Flame className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
              AIInsight
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
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
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return link;
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
          {!collapsed && <span>{resolved === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {!collapsed && user && (
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
              onClick={logout}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-hover transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
