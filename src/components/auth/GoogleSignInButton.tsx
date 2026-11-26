import React, { useEffect, useRef, useState } from 'react';
import { createNonce, googleClientId, loadGoogleIdentity } from '../../lib/googleIdentity';

interface GoogleSignInButtonProps {
  mode: 'signIn' | 'signUp';
  disabled?: boolean;
  onCredential: (idToken: string, rawNonce: string) => void;
  fallback: React.ReactNode;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ mode, disabled, onCredential, fallback }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(googleClientId ? 'loading' : 'unavailable');

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;

    (async () => {
      try {
        const [api, nonce] = await Promise.all([loadGoogleIdentity(), createNonce()]);
        const container = containerRef.current;
        if (cancelled || !container) return;
        api.initialize({
          client_id: googleClientId,
          nonce: nonce.hashed,
          context: mode === 'signUp' ? 'signup' : 'signin',
          use_fedcm_for_button: true,
          itp_support: true,
          callback: ({ credential }) => callbackRef.current(credential, nonce.raw),
        });
        container.replaceChildren();
        const width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, container.offsetWidth || MAX_WIDTH)));
        api.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'signUp' ? 'signup_with' : 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width,
          locale: 'pt-BR',
        });
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (status === 'unavailable') return <>{fallback}</>;

  return (
    <div
      className={`w-full min-h-11 flex justify-center transition-opacity ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      aria-busy={status === 'loading' || undefined}
      aria-disabled={disabled || undefined}
    >
      <div ref={containerRef} className="w-full max-w-[400px] flex justify-center" data-testid="google-signin-button" />
    </div>
  );
};
