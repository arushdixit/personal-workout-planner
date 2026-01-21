import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Login from './Login';
import Signup from './Signup';
import { Link } from 'react-router-dom';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {isLogin ? <Login /> : <Signup />}

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </div>
    </div>
  );
}