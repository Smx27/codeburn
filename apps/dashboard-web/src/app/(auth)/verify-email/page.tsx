'use client';

import Link from 'next/link';
import { Check, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifyEmailPage() {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Verify your email</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification link to your email address. Please check your inbox and click the link to activate your account.
          </p>
        </div>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/login">
              Continue to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email?{' '}
            <button className="text-primary hover:text-primary/80 transition-colors">
              Resend
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
