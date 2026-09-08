import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json({ error: 'Missing uid or role' }, { status: 400 });
    }

    // Set custom user claims
    await adminAuth.setCustomUserClaims(uid, { role });

    return NextResponse.json({ message: `Successfully set role ${role} for user ${uid}` });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
