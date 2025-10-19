import { NextRequest, NextResponse } from 'next/server';
import {
  getUserColorFromServer,
  saveUserColorToServer,
  deleteUserColorFromServer
} from '@/lib/userColors';

/**
 * GET /api/user-colors/:username
 * Get a specific user's color from server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const color = await getUserColorFromServer(username);

    if (color === null) {
      return NextResponse.json({ error: 'User color not found' }, { status: 404 });
    }

    return NextResponse.json({ color, username });
  } catch (error) {
    console.error('Error getting user color:', error);
    return NextResponse.json(
      { error: 'Failed to get user color' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user-colors/:username
 * Set a user's color on server
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { color } = await request.json();

    if (!color || typeof color !== 'string') {
      return NextResponse.json(
        { error: 'Color is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate color format (basic hex color validation)
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be a hex color like #FF0000' },
        { status: 400 }
      );
    }

    const success = await saveUserColorToServer(username, color);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save user color' },
        { status: 500 }
      );
    }

    return NextResponse.json({ color, username, success: true });
  } catch (error) {
    console.error('Error setting user color:', error);
    return NextResponse.json(
      { error: 'Failed to set user color' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-colors/:username
 * Delete a user's color from server
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const success = await deleteUserColorFromServer(username);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user color' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error('Error deleting user color:', error);
    return NextResponse.json(
      { error: 'Failed to delete user color' },
      { status: 500 }
    );
  }
}
