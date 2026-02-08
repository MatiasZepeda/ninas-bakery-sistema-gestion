import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { pin } = await request.json();

  // PIN por defecto: "nina" - cambiar en variable de entorno NINA_PIN
  const validPin = process.env.NINA_PIN && process.env.NINA_PIN.length > 0
    ? process.env.NINA_PIN
    : 'nina';

  console.log('PIN attempt:', pin, 'Valid PIN:', validPin); // Debug

  if (pin === validPin) {
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
