'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  useEffect(() => {
    const slug = localStorage.getItem('leagueSlug');
    if (slug) {
      fetch(`/api/play/league-name?slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(data => { if (data.name) setLeagueName(data.name); });
    }
  }, []);

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
      if (rememberMe) localStorage.setItem('rememberMe', '1');
      else localStorage.removeItem('rememberMe');
      router.push(callbackUrl);
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a2e',
    border: '1px solid #7777cc',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

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
        background: '#2a2a45',
        border: '1px solid #7777cc',
        borderRadius: '12px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎳</div>
          {leagueName ? (
            <>
              <p style={{ color: '#8888aa', fontSize: '12px', marginBottom: '4px' }}>Welcome back to</p>
              <h1 style={{ color: '#e8ff47', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                {leagueName}
              </h1>
            </>
          ) : (
            <>
              <p style={{ color: '#8888aa', fontSize: '12px', marginBottom: '4px' }}>Welcome to</p>
              <h1 style={{ color: '#e8ff47', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                Bowling Poker Digiplay
              </h1>
            </>
          )}
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
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
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
              style={inputStyle}
            />
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: '#e8ff47', cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: 12, color: '#8888aa', cursor: 'pointer' }}>
              Remember me on this device
            </label>
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
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {leagueName && (
          <p style={{ textAlign: 'center', color: '#555577', fontSize: '11px',
            fontStyle: 'italic', marginTop: '32px' }}>
            Powered by Bowling Poker Digiplay
          </p>
        )}
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
