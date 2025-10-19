import { NextResponse } from 'next/server';
import { getAllUserColorsFromServer } from '@/lib/userColors';

/**
 * GET /api/user-colors
 * Get all user colors from server
 */
export async function GET() {
  try {
    const userColors = await getAllUserColorsFromServer();
    return NextResponse.json({ userColors });
  } catch (error) {
    console.error('Error getting all user colors:', error);
    return NextResponse.json(
      { error: 'Failed to get user colors' },
      { status: 500 }
    );
  }
}
