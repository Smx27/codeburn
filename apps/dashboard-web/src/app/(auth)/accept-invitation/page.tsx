'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, User, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '@/lib/storage-keys';

const acceptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptForm = z.infer<typeof acceptSchema>;

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [invitationInfo, setInvitationInfo] = useState<{ email?: string; organization?: string; role?: string }>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    // Token is valid, show the form
    setStatus('form');
  }, [token]);

  const onSubmit = async (data: AcceptForm) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/v1/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          password: data.password,
          name: data.name,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store the JWT token
        if (result.token) {
          localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);
          if (result.user) {
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(result.user));
          }
        }
        setStatus('success');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Invalid invitation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This invitation link is invalid or has expired.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Welcome to the team!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account has been created. Redirecting to dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-1 mb-6">
          <h2 className="text-lg font-semibold text-foreground">Accept invitation</h2>
          <p className="text-sm text-muted-foreground">
            Set your name and password to join the team
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('name')}
                type="text"
                id="name"
                autoComplete="name"
                className="pl-10"
                placeholder="Your name"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="new-password"
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Join team
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
