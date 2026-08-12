import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'Kf$W8Dx0UaSf0shubham@93';

    if (!expectedPasscode) {
      return NextResponse.json(
        { error: 'Server error: ADMIN_PASSCODE environment variable is not configured.' },
        { status: 500 }
      );
    }

    if (passcode === expectedPasscode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
