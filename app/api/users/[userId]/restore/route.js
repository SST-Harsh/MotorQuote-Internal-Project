import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * PUT /api/users/:userId/restore
 * Restore a suspended user (Super Admin only)
 *
 * Request body: Empty (no body required)
 */
export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const role = cookieStore.get('role')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only super_admin can restore users
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Super Admin only.' }, { status: 403 });
    }

    // Get the backend URL from environment
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'https://elastic-meitner.74-208-164-206.plesk.page';

    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/users/${userId}/restore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    return NextResponse.json({ error: 'Failed to restore user' }, { status: 500 });
  }
}
