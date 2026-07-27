import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { signIn, loading } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSSO, setIsCheckingSSO] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated via Cloudflare Access headers on page load
    const checkCloudflareAuth = async () => {
      try {
        const response = await fetch('/api/cf-auth');
        
        // If serverless endpoint redirected to Supabase magic link
        if (response.redirected && response.url) {
          window.location.href = response.url;
          return;
        }

        const data = await response.json().catch(() => null);
        if (data?.authenticated === false) {
          // No Cloudflare Access header found (e.g., local dev)
          setIsCheckingSSO(false);
        }
      } catch (err) {
        console.log('[CF-SSO] Cloudflare SSO check skipped or not present:', err);
        setIsCheckingSSO(false);
      }
    };

    checkCloudflareAuth();
  }, []);

  const handleCloudflareSSO = () => {
    setIsCheckingSSO(true);
    window.location.href = '/api/cf-auth';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSSO) {
    return (
      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-sm text-muted-foreground text-center">
          Connecting to Cloudflare Access SSO identity...
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm">
      <h1 className="text-3xl font-bold mb-2 text-red-500">Welcome Back</h1>
      <p className="text-muted-foreground mb-6">Sign in to access your fitness journey</p>

      <Button
        type="button"
        variant="outline"
        className="w-full mb-6 py-5 border-muted-foreground/30 hover:bg-accent"
        onClick={handleCloudflareSSO}
      >
        <ShieldCheck className="mr-2 h-5 w-5 text-emerald-500" />
        Sign in with Cloudflare SSO
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or use email fallback
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Card>
  );
}