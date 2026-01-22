import { Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EmailVerificationProps {
  email: string;
  onBackToLogin: () => void;
}

export default function EmailVerification({ email, onBackToLogin }: EmailVerificationProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to resend email:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a verification link to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
          <div className="flex gap-3 text-sm">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Check Your Email</p>
              <p className="text-muted-foreground">
                Click the verification link in the email we sent you. This may take a few minutes to arrive.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-3">
            <p className="text-xs text-muted-foreground">
              Once verified, you can sign in with your email and password.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={resendLoading || resendSuccess}
              variant="ghost"
              className="w-full"
            >
              {resendSuccess ? 'Email resent!' : resendLoading ? 'Sending...' : 'Didn\'t receive? Resend'}
            </Button>
          </div>
        </div>

        <Button
          onClick={onBackToLogin}
          variant="outline"
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}
