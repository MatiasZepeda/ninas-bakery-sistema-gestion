'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const APP_PIN = process.env.NEXT_PUBLIC_APP_PIN || '1234';
const AUTO_EMAIL = 'owner@ninasbakery.local';
const AUTO_PASSWORD = 'NinasBakerySecure2024';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      handlePinComplete(pin);
    }
  }, [pin]);

  const handlePinComplete = async (enteredPin: string) => {
    if (enteredPin !== APP_PIN) {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
        inputRef.current?.focus();
      }, 600);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Try signing in first (account already exists)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: AUTO_EMAIL,
        password: AUTO_PASSWORD,
      });

      if (!signInError) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Account doesn't exist - create it
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: AUTO_EMAIL,
        password: AUTO_PASSWORD,
      });

      if (signUpError) throw signUpError;

      if (signUpData.session) {
        // Email confirmation disabled - we're signed in
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Email confirmation is enabled - try signing in anyway
      // (some Supabase configs auto-confirm)
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: AUTO_EMAIL,
        password: AUTO_PASSWORD,
      });

      if (!retryError) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Need to disable email confirmation in Supabase
      toast.error(
        'Setup needed: Go to Supabase > Authentication > Settings and disable "Confirm email"'
      );
      setPin('');
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Connection error. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      setPin((prev) => prev.slice(0, -1));
      e.preventDefault();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleDotClick = () => {
    inputRef.current?.focus();
  };

  const handleNumPad = (digit: string) => {
    if (loading) return;
    if (digit === 'del') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs text-center space-y-8">
        <div className="space-y-3">
          <div className="flex justify-center">
            <Image
              src="/images/logo-circle.jpeg"
              alt="Nina's Bakery"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-nina-brown">
              Nina&apos;s Bakery
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enter PIN to continue</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-nina-brown" />
          </div>
        ) : (
          <>
            {/* Hidden input for keyboard support */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              value={pin}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="sr-only"
              autoFocus
              aria-label="PIN input"
            />

            {/* PIN dots */}
            <div
              className={`flex justify-center gap-4 ${error ? 'animate-shake' : ''}`}
              onClick={handleDotClick}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pin.length > i
                      ? 'bg-nina-brown scale-110'
                      : 'bg-nina-cream border-2 border-nina-brown/30'
                  } ${error ? 'bg-red-500' : ''}`}
                />
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(
                (key) => {
                  if (key === '') return <div key="empty" />;
                  return (
                    <button
                      key={key}
                      onClick={() => handleNumPad(key)}
                      className={`h-14 rounded-xl text-lg font-medium transition-colors
                        ${
                          key === 'del'
                            ? 'text-muted-foreground hover:text-foreground text-sm'
                            : 'text-nina-brown hover:bg-nina-cream active:bg-nina-cream/70'
                        }`}
                    >
                      {key === 'del' ? '\u232B' : key}
                    </button>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
