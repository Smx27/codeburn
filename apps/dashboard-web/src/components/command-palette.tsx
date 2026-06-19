'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  Box,
  Users,
  TrendingUp,
  Settings,
  Key,
  Sun,
  Moon,
  Copy,
  Plus,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessions', href: '/sessions', icon: Activity },
  { label: 'Providers', href: '/providers', icon: Cpu },
  { label: 'Models', href: '/models', icon: Box },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Trends', href: '/trends', icon: TrendingUp },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'API Keys', href: '/settings/api-keys', icon: Key },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolved, toggleTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleCopyApiUrl = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    navigator.clipboard.writeText(url);
    setOpen(false);
  }, []);

  const handleCopyAppUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.origin);
    setOpen(false);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleNavigate(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              <CommandShortcut>{item.href}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { handleCopyAppUrl(); }}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy App URL</span>
          </CommandItem>
          <CommandItem onSelect={() => { handleCopyApiUrl(); }}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy API URL</span>
          </CommandItem>
          <CommandItem onSelect={() => { toggleTheme(); setOpen(false); }}>
            {resolved === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => { handleNavigate('/settings/api-keys'); }}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create API Key</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
