'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('resend');
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/api/v1/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!email) return;

    setResendLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      await fetch(`${apiUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendSuccess(true);
    } catch {
      // Silently handle error
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardContent className="p-6 text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Verifying your email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we verify your email address...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Email verified!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your email has been verified. You can now sign in to your account.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                Continue to login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Mail className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Verification failed</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The verification link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                Back to login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}

        {status === 'resend' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Verify your email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a verification link to your email address. Please check your inbox and click the link to activate your account.
              </p>
            </div>
            {resendSuccess ? (
              <p className="text-sm text-green-500">Verification email sent! Check your inbox.</p>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
                />
                <Button 
                  onClick={handleResend} 
                  disabled={!email || resendLoading}
                  className="w-full"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
                Back to login
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
