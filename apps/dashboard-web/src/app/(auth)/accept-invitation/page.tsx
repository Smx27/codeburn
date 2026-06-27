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
        if (result.token) {
          localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);
          if (result.user) {
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(result.user));
          }
        }
        setStatus('success');
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
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_60px_-15px_rgba(119,255,46,0.1)]">
        <div className="text-center space-y-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-white/40">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_60px_-15px_rgba(119,255,46,0.1)]">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Invalid invitation</h2>
            <p className="text-sm text-white/40 mt-1">
              This invitation link is invalid or has expired.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full border-white/[0.08] text-white/60 hover:bg-white/[0.05] hover:text-white">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_60px_-15px_rgba(119,255,46,0.1)]">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome to the team!</h2>
            <p className="text-sm text-white/40 mt-1">
              Your account has been created. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_60px_-15px_rgba(119,255,46,0.1)]">
      <div className="space-y-1 mb-6">
        <h2 className="text-lg font-semibold text-white">Accept invitation</h2>
        <p className="text-sm text-white/40">
          Set your name and password to join the team
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/60">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              {...register('name')}
              type="text"
              id="name"
              autoComplete="name"
              className="pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20"
              placeholder="Your name"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/60">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              {...register('password')}
              type="password"
              id="password"
              autoComplete="new-password"
              className="pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/60">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              {...register('confirmPassword')}
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              className="pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(119,255,46,0.2)] hover:shadow-[0_0_30px_rgba(119,255,46,0.3)] transition-all"
          disabled={isSubmitting}
        >
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
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
