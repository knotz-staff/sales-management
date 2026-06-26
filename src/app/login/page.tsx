"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pw })
      });
      
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
        <h2 className="title" style={{ textAlign: 'center', marginBottom: '2rem' }}>영업관리 로그인</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">아이디</label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={id}
              onChange={e => setId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">비밀번호</label>
            <input 
              type="password" 
              className="form-input" 
              required
              value={pw}
              onChange={e => setPw(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <div style={{ color: 'var(--status-red)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
