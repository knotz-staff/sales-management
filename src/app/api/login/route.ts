import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { id, pw } = await request.json();
    
    if (id === 'admin' && pw === 'admin') {
      const cookieStore = await cookies();
      cookieStore.set('is_logged_in', 'true', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
