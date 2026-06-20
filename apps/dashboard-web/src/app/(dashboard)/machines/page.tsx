'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/storage-keys';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Machine {
  id: string;
  hostname: string;
  os: string | null;
  architecture: string | null;
  agent_version: string | null;
  status: string;
  last_seen: string;
}

export default function MachinesPage() {
  const { data: machines, isLoading } = useQuery<Machine[]>({
    queryKey: ['machines'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const response = await fetch(`${apiUrl}/api/v1/machines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch machines');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">Manage your synced machines</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
        <p className="text-muted-foreground">Manage your synced machines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Machines</CardTitle>
        </CardHeader>
        <CardContent>
          {!machines || machines.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No machines connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run <code className="bg-muted px-1 rounded">aiinsight login</code> to connect a machine
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Agent Version</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{machine.hostname}</p>
                          <p className="text-sm text-muted-foreground">{machine.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={machine.status === 'ONLINE' ? 'default' : 'secondary'}>
                        {machine.status === 'ONLINE' ? (
                          <Wifi className="h-3 w-3 mr-1" />
                        ) : (
                          <WifiOff className="h-3 w-3 mr-1" />
                        )}
                        {machine.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {machine.os || 'Unknown'} {machine.architecture ? `(${machine.architecture})` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{machine.agent_version || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(machine.last_seen), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/machines/${machine.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
