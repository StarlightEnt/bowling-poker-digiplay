'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#16213e',
        border: '1px solid #2a2a5a',
        borderRadius: '12px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎳</div>
          <h1 style={{ color: '#e8ff47', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            Bowling Poker Digiplay
          </h1>
          <p style={{ color: '#8888aa', fontSize: '13px' }}>Admin Console</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#8888aa', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                background: '#0f3460',
                border: '1px solid #2a2a5a',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#8888aa', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: '#0f3460',
                border: '1px solid #2a2a5a',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#2a1010',
              border: '1px solid #ff6666',
              borderRadius: '6px',
              color: '#ff6666',
              padding: '10px 14px',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#e8ff47',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#555577', fontSize: '11px',
          fontStyle: 'italic', marginTop: '32px' }}>
          Powered by Bowling Poker Digiplay
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
