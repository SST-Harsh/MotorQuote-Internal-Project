import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * PUT /api/users/:userId/suspend
 * Suspend a user with reason (Super Admin only)
 *
 * Request body: { "reason": "Violating company policy" }
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

    // Only super_admin can suspend users
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Super Admin only.' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 });
    }

    // Get the backend URL from environment
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'https://elastic-meitner.74-208-164-206.plesk.page';

    // First, get the user to check if already suspended
    const userResponse = await fetch(`${backendUrl}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = await userResponse.json();

    // Check if user is already suspended
    if (userData.suspended_at) {
      return NextResponse.json(
        {
          error: 'User is already suspended',
          suspended_at: userData.suspended_at,
          suspension_reason: userData.suspension_reason,
        },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/users/${userId}/suspend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}
