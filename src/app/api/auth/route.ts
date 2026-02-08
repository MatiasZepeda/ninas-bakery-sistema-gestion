import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// PIN por defecto: "nina" - cambiar en variable de entorno NINA_PIN
const VALID_PIN = process.env.NINA_PIN || 'nina';

export async function POST(request: Request) {
  const { pin } = await request.json();

  if (pin === VALID_PIN) {
    const cookieStore = await cookies();
    cookieStore.set('nina-auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('nina-auth');
  return NextResponse.json({ success: true });
}
